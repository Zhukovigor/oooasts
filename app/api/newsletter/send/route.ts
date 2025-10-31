import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { campaignId, templateId, subscriberIds, fromEmail, templateData } = await request.json()

    const supabase = await createServerClient()

    // Fetch template with attachments if templateData not provided
    let template
    let attachments = []
    
    if (templateData) {
      // Используем данные из templateData если они переданы
      template = templateData
      attachments = templateData.attachments || []
    } else {
      // Иначе загружаем из базы
      const { data: templateResult } = await supabase
        .from("email_templates")
        .select("*, attachments")
        .eq("id", templateId)
        .single()

      if (!templateResult) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }
      template = templateResult
      attachments = templateResult.attachments || []
    }

    console.log("[v0] Template attachments:", attachments)

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

    // Prepare attachments if any
    let emailAttachments = []
    if (attachments && attachments.length > 0) {
      console.log("[v0] Preparing attachments:", attachments.length)
      
      for (const attachment of attachments) {
        try {
          // Скачиваем файл из Supabase Storage
          console.log("[v0] Downloading attachment:", attachment.name, attachment.url)
          
          const response = await fetch(attachment.url)
          if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`)
          }
          
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          
          emailAttachments.push({
            filename: attachment.name,
            content: buffer,
            contentType: attachment.type
          })
          
          console.log("[v0] Attachment prepared:", attachment.name)
        } catch (error) {
          console.error("[v0] Error preparing attachment:", attachment.name, error)
          // Продолжаем отправку даже если одно вложение не загрузилось
        }
      }
    }

    console.log("[v0] Total attachments prepared:", emailAttachments.length)

    // Send emails
    let sentCount = 0
    for (const subscriber of subscribers) {
      try {
        console.log("[v0] Sending email to:", subscriber.email)
        console.log("[v0] HTML content length:", template.html_content.length)
        console.log("[v0] Attachments count:", emailAttachments.length)

        const mailOptions = {
          from: `${template.from_name} <${fromEmail}>`,
          to: subscriber.email,
          subject: template.subject,
          html: template.html_content,
          replyTo: template.reply_to || fromEmail,
        }

        // Добавляем вложения если они есть
        if (emailAttachments.length > 0) {
          mailOptions.attachments = emailAttachments
        }

        await transporter.sendMail(mailOptions)

        console.log("[v0] Email sent successfully to:", subscriber.email)

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

    return NextResponse.json({ 
      success: true, 
      sentCount,
      totalSubscribers: subscribers.length,
      attachmentsCount: emailAttachments.length
    })
  } catch (error) {
    console.error("Error sending campaign:", error)
    return NextResponse.json({ 
      error: "Failed to send campaign: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 })
  }
}
