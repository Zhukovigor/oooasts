import nodemailer from "nodemailer"

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

const emailConfig: EmailConfig | null = null

export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    // Get settings from Supabase
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { data } = await supabase.from("notification_settings").select("*").single()

    if (!data?.email_enabled || !data?.email_host || !data?.email_from) {
      console.log("[v0] Email not configured or disabled")
      return null
    }

    return {
      host: data.email_host,
      port: data.email_port || 465,
      secure: data.email_secure || false,
      auth: {
        user: data.email_user,
        pass: data.email_password,
      },
      from: data.email_from,
    }
  } catch (error) {
    console.error("[v0] Error getting email config:", error)
    return null
  }
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const config = await getEmailConfig()
    if (!config) {
      console.log("[v0] Email configuration not available")
      return false
    }

    const transporter = nodemailer.createTransport(config)

    const result = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
    })

    console.log("[v0] Email sent successfully:", result.messageId)
    return true
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return false
  }
}
