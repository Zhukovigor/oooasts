import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Rate limiting store (in production, use Redis)
const rateLimit = new Map()

// Input validation schema
interface EmailRequest {
  to: string
  subject: string
  html: string
  adminEmail?: string
}

export async function POST(request: NextRequest) {
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // Rate limiting check
  if (isRateLimited(clientIP)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const body: EmailRequest = await request.json()

    // Validate required fields
    const validationError = validateEmailRequest(body)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    const { to, subject, html, adminEmail } = body

    const supabase = createAdminClient()

    // Get SMTP configuration with error handling
    const { data: smtpAccount, error: smtpError } = await supabase
      .from("smtp_accounts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (smtpError || !smtpAccount) {
      console.error("[Email API] SMTP configuration error:", smtpError?.message)
      return NextResponse.json(
        { error: "Email service temporarily unavailable" },
        { status: 503 }
      )
    }

    // Validate SMTP configuration
    const configError = validateSmtpConfig(smtpAccount)
    if (configError) {
      console.error("[Email API] Invalid SMTP configuration:", configError)
      return NextResponse.json(
        { error: "Email service configuration error" },
        { status: 500 }
      )
    }

    // Create transporter with better configuration
    const transporter = nodemailer.createTransport({
      host: smtpAccount.smtp_host,
      port: smtpAccount.smtp_port,
      secure: smtpAccount.smtp_port === 465, // or 587 for STARTTLS
      auth: {
        user: smtpAccount.smtp_user,
        pass: smtpAccount.smtp_password,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    // Verify transporter configuration
    try {
      await transporter.verify()
    } catch (verifyError) {
      console.error("[Email API] SMTP connection failed:", verifyError)
      return NextResponse.json(
        { error: "Email service connection failed" },
        { status: 502 }
      )
    }

    // Prepare and send user email
    const userMailOptions = {
      from: formatFromAddress(smtpAccount.name, smtpAccount.email),
      to: to,
      subject: subject.trim(),
      html: html,
      replyTo: smtpAccount.email,
      headers: {
        'X-Mailer': 'Next.js Email API',
        'X-Application': 'Your-App-Name'
      }
    }

    console.log("[Email API] Sending email to user:", to)
    const userResult = await transporter.sendMail(userMailOptions)
    console.log("[Email API] User email sent:", result.messageId)

    // Send admin notification if needed
    let adminResult = null
    if (adminEmail && adminEmail !== to && isValidEmail(adminEmail)) {
      const adminMailOptions = {
        ...userMailOptions,
        to: adminEmail,
        subject: `[НОВАЯ ЗАЯВКА] ${subject.trim()}`,
      }

      console.log("[Email API] Sending notification to admin:", adminEmail)
      adminResult = await transporter.sendMail(adminMailOptions)
      console.log("[Email API] Admin email sent:", adminResult.messageId)
    }

    // Log email sending for analytics
    await logEmailEvent(supabase, {
      to,
      subject,
      admin_email: adminEmail,
      user_message_id: userResult.messageId,
      admin_message_id: adminResult?.messageId,
      smtp_account_id: smtpAccount.id,
      status: 'sent'
    })

    return NextResponse.json({ 
      success: true,
      messageId: userResult.messageId,
      adminMessageId: adminResult?.messageId 
    })

  } catch (error) {
    console.error("[Email API] Unexpected error:", error)
    
    // Log the error
    await logEmailEvent(supabase, {
      to: body?.to || 'unknown',
      subject: body?.subject || 'unknown',
      admin_email: body?.adminEmail,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }).catch(console.error)

    return NextResponse.json(
      { 
        error: "Internal server error",
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : "Unknown error"
        })
      },
      { status: 500 }
    )
  }
}

// Helper functions
function validateEmailRequest(body: any): string | null {
  if (!body.to || !body.subject || !body.html) {
    return "Missing required fields: to, subject, html"
  }

  if (!isValidEmail(body.to)) {
    return "Invalid recipient email address"
  }

  if (body.adminEmail && !isValidEmail(body.adminEmail)) {
    return "Invalid admin email address"
  }

  if (body.subject.length > 200) {
    return "Subject too long (max 200 characters)"
  }

  return null
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validateSmtpConfig(smtpAccount: any): string | null {
  if (!smtpAccount.smtp_host || !smtpAccount.smtp_port || 
      !smtpAccount.smtp_user || !smtpAccount.smtp_password) {
    return "Incomplete SMTP configuration"
  }

  if (typeof smtpAccount.smtp_port !== 'number' || smtpAccount.smtp_port <= 0) {
    return "Invalid SMTP port"
  }

  return null
}

function formatFromAddress(name: string, email: string): string {
  return name ? `${name} <${email}>` : email
}

function isRateLimited(identifier: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 10 // maximum 10 requests per window
  
  const requests = rateLimit.get(identifier) || []
  const recentRequests = requests.filter((time: number) => now - time < windowMs)
  
  if (recentRequests.length >= maxRequests) {
    return true
  }
  
  recentRequests.push(now)
  rateLimit.set(identifier, recentRequests)
  
  // Clean up old entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean up
    for (const [key, times] of rateLimit.entries()) {
      const validTimes = (times as number[]).filter((time: number) => now - time < windowMs)
      if (validTimes.length === 0) {
        rateLimit.delete(key)
      } else {
        rateLimit.set(key, validTimes)
      }
    }
  }
  
  return false
}

async function logEmailEvent(
  supabase: any, 
  event: {
    to: string
    subject: string
    admin_email?: string
    user_message_id?: string
    admin_message_id?: string
    smtp_account_id: string
    status: 'sent' | 'failed'
    error?: string
  }
) {
  try {
    await supabase
      .from("email_logs")
      .insert({
        ...event,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error("[Email API] Failed to log email event:", error)
  }
}
