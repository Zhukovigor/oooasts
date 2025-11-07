// app/api/newsletter/send/route.ts
import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { campaignId, templateId, subscriberIds, fromEmail, templateData } = await request.json()

    // Валидация обязательных полей
    if (!campaignId || !subscriberIds || !fromEmail) {
      return NextResponse.json(
        { error: "Missing required fields: campaignId, subscriberIds, fromEmail" },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Получаем или используем данные шаблона
    let template
    let attachments = []
    
    if (templateData) {
      // Используем данные из templateData если они переданы
      template = templateData
      attachments = templateData.attachments || []
    } else if (templateId) {
      // Иначе загружаем из базы
      const { data: templateResult, error: templateError } = await supabase
        .from("email_templates")
        .select("*, attachments")
        .eq("id", templateId)
        .single()

      if (templateError || !templateResult) {
        console.error("[v0] Template not found:", templateError)
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }
      template = templateResult
      attachments = templateResult.attachments || []
    } else {
      return NextResponse.json({ error: "Either templateId or templateData is required" }, { status: 400 })
    }

    console.log("[v0] Template attachments:", attachments)

    // Проверяем существование кампании
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (campaignError || !campaign) {
      console.error("[v0] Campaign not found:", campaignError)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Проверяем статус кампании
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return NextResponse.json({ error: "Campaign already sent or in progress" }, { status: 400 })
    }

    // Обновляем статус кампании на "отправляется"
    await supabase
      .from("email_campaigns")
      .update({
        status: "sending",
        started_at: new Date().toISOString()
      })
      .eq("id", campaignId)

    // Fetch SMTP account
    const { data: smtpAccount, error: smtpError } = await supabase
      .from("smtp_accounts")
      .select("*")
      .eq("email", fromEmail)
      .eq("is_active", true)
      .single()

    if (smtpError || !smtpAccount) {
      console.error("[v0] SMTP account not found:", smtpError)
      
      // Обновляем статус кампании на failed
      await supabase
        .from("email_campaigns")
        .update({
          status: "failed",
          error_message: "SMTP account not found"
        })
        .eq("id", campaignId)
        
      return NextResponse.json({ error: "SMTP account not found" }, { status: 404 })
    }

    // Создаем транспортер с улучшенными настройками
    const transporter = nodemailer.createTransport({
      host: smtpAccount.smtp_host,
      port: smtpAccount.smtp_port,
      secure: smtpAccount.smtp_port === 465,
      auth: {
        user: smtpAccount.smtp_user,
        pass: smtpAccount.smtp_password,
      },
      connectionTimeout: 30000, // 30 секунд
      greetingTimeout: 30000,
      socketTimeout: 30000,
    })

    // Проверяем соединение с SMTP
    try {
      await transporter.verify()
      console.log("[v0] SMTP connection verified successfully")
    } catch (error) {
      console.error("[v0] SMTP connection failed:", error)
      
      await supabase
        .from("email_campaigns")
        .update({
          status: "failed",
          error_message: "SMTP connection failed"
        })
        .eq("id", campaignId)
        
      return NextResponse.json({ error: "SMTP connection failed" }, { status: 500 })
    }

    // Fetch subscribers - ИСПРАВЛЕНИЕ: используем contact_list_contacts вместо newsletter_subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("contact_list_contacts")
      .select("id, email, name")
      .in("id", subscriberIds)

    if (subscribersError || !subscribers || subscribers.length === 0) {
      console.error("[v0] No subscribers found:", subscribersError)
      
      await supabase
        .from("email_campaigns")
        .update({
          status: "failed",
          error_message: "No subscribers found"
        })
        .eq("id", campaignId)
        
      return NextResponse.json({ error: "No subscribers found" }, { status: 404 })
    }

    console.log(`[v0] Found ${subscribers.length} subscribers to send emails to`)

    // Подготавливаем вложения если они есть
    let emailAttachments = []
    if (attachments && attachments.length > 0) {
      console.log("[v0] Preparing attachments:", attachments.length)
      
      for (const attachment of attachments) {
        try {
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

    // Отправляем emails с улучшенной обработкой ошибок
    let sentCount = 0
    let failedCount = 0
    const batchSize = 5 // Отправляем по 5 писем за раз чтобы не перегружать SMTP

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      const batchPromises = []

      for (const subscriber of batch) {
        batchPromises.push(
          (async () => {
            try {
              console.log("[v0] Sending email to:", subscriber.email)

              // Персонализируем контент
              const personalizedHtml = personalizeContent(template.html_content, subscriber)
              const personalizedSubject = personalizeContent(template.subject, subscriber)

              const mailOptions = {
                from: `${template.from_name || smtpAccount.name} <${fromEmail}>`,
                to: subscriber.email,
                subject: personalizedSubject,
                html: personalizedHtml,
                replyTo: template.reply_to || fromEmail,
                attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
              }

              await transporter.sendMail(mailOptions)

              console.log("[v0] Email sent successfully to:", subscriber.email)

              // Логируем успех
              await supabase.from("email_campaign_logs").insert({
                campaign_id: campaignId,
                subscriber_id: subscriber.id,
                email: subscriber.email,
                status: "sent",
                sent_at: new Date().toISOString(),
              })

              sentCount++
            } catch (error) {
              console.error(`[v0] Failed to send to ${subscriber.email}:`, error)

              // Логируем ошибку
              await supabase.from("email_campaign_logs").insert({
                campaign_id: campaignId,
                subscriber_id: subscriber.id,
                email: subscriber.email,
                status: "failed",
                error_message: error instanceof Error ? error.message : "Unknown error",
              })

              failedCount++
            }
          })()
        )
      }

      // Ожидаем завершения текущего батча
      await Promise.allSettled(batchPromises)

      // Задержка между батчами
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // Обновляем статус кампании
    const finalStatus = failedCount === subscribers.length ? "failed" : 
                       failedCount > 0 ? "partial" : "sent"

    await supabase
      .from("email_campaigns")
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaignId)

    console.log(`[v0] Campaign completed: ${sentCount} sent, ${failedCount} failed`)

    return NextResponse.json({ 
      success: true, 
      sentCount,
      failedCount,
      totalSubscribers: subscribers.length,
      attachmentsCount: emailAttachments.length,
      status: finalStatus
    })
  } catch (error) {
    console.error("[v0] Error sending campaign:", error)
    
    // Обновляем статус кампании на failed в случае общей ошибки
    try {
      const supabase = await createServerClient()
      await supabase
        .from("email_campaigns")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error"
        })
        .eq("id", campaignId)
    } catch (updateError) {
      console.error("[v0] Error updating campaign status:", updateError)
    }
    
    return NextResponse.json({ 
      error: "Failed to send campaign: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 })
  }
}

// Функция для персонализации контента
function personalizeContent(content: string, subscriber: any): string {
  if (!content) return content
  
  let personalized = content
  
  // Заменяем плейсхолдеры
  personalized = personalized.replace(/{{name}}/gi, subscriber.name || '')
  personalized = personalized.replace(/{{email}}/gi, subscriber.email || '')
  personalized = personalized.replace(/{{first_name}}/gi, getFirstName(subscriber.name) || '')
  
  return personalized
}

// Вспомогательная функция для получения имени
function getFirstName(fullName: string | null): string {
  if (!fullName) return ''
  return fullName.split(' ')[0] || ''
}
