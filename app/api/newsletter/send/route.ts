Вот мой старый API endpoint для отправки email через Nodemailer с использованием SMTP аккаунтов из базы данных:
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, adminEmail } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields: to, subject, html" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: smtpAccount } = await supabase
      .from("smtp_accounts")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .limit(1)
      .single()

    if (!smtpAccount) {
      console.error("[v0] No active SMTP account found")
      return NextResponse.json({ error: "SMTP account not configured" }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpAccount.smtp_host,
      port: smtpAccount.smtp_port,
      secure: smtpAccount.smtp_port === 465,
      auth: {
        user: smtpAccount.smtp_user,
        pass: smtpAccount.smtp_password,
      },
    })

    const userMailOptions = {
      from: `${smtpAccount.name} <${smtpAccount.email}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: smtpAccount.email,
    }

    console.log("[v0] Sending email to user:", to)
    await transporter.sendMail(userMailOptions)

    if (adminEmail && adminEmail !== to) {
      const adminMailOptions = {
        from: `${smtpAccount.name} <${smtpAccount.email}>`,
        to: adminEmail,
        subject: `[НОВАЯ ЗАЯВКА] ${subject}`,
        html: html,
        replyTo: smtpAccount.email,
      }

      console.log("[v0] Sending notification to admin:", adminEmail)
      await transporter.sendMail(adminMailOptions)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Email API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}
