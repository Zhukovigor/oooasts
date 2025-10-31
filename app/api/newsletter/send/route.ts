import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { campaignId, templateId, subscriberIds, fromEmail } = await request.json()

    const supabase = await createServerClient()

    // Fetch template
    const { data: template } = await supabase.from("email_templates").select("*").eq("id", templateId).single()

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Fetch SMTP account
    const { data: smtpAccount } = await supabase
      .from("smtp_accounts")
      .select("*")
      .eq("email", fromEmail)
      .eq("is_active", true)
      .single()

    if (!smtpAccount) {
      return NextResponse.json({ error: "SMTP account not found" }, { status: 404 })
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpAccount.smtp_host,
      port: smtpAccount.smtp_port,
      secure: smtpAccount.smtp_port === 465,
      auth: {
        user: smtpAccount.smtp_user,
        pass: smtpAccount.smtp_password,
      },
    })

    // Fetch subscribers
    const { data: subscribers } = await supabase.from("newsletter_subscribers").select("*").in("id", subscriberIds)

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: "No subscribers found" }, { status: 404 })
    }

    // Send emails
    let sentCount = 0
    for (const subscriber of subscribers) {
      try {
        await transporter.sendMail({
          from: `${template.from_name} <${fromEmail}>`,
          to: subscriber.email,
          subject: template.subject,
          html: template.html_content,
          replyTo: template.reply_to || fromEmail,
        })

        // Log success
        await supabase.from("email_campaign_logs").insert({
          campaign_id: campaignId,
          subscriber_id: subscriber.id,
          email: subscriber.email,
          status: "sent",
          sent_at: new Date().toISOString(),
        })

        sentCount++
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error)

        // Log failure
        await supabase.from("email_campaign_logs").insert({
          campaign_id: campaignId,
          subscriber_id: subscriber.id,
          email: subscriber.email,
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Update campaign
    await supabase
      .from("email_campaigns")
      .update({
        sent_count: sentCount,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId)

    return NextResponse.json({ success: true, sentCount })
  } catch (error) {
    console.error("Error sending campaign:", error)
    return NextResponse.json({ error: "Failed to send campaign" }, { status: 500 })
  }
}
