// app/api/newsletter/send/route.ts
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  let campaignId: string | null = null
  
  try {
    const { campaignId: requestCampaignId, templateId, subscriberIds, fromEmail, templateData } = await request.json()
    campaignId = requestCampaignId

    // Валидация обязательных полей
    if (!campaignId || !subscriberIds || !fromEmail) {
      return NextResponse.json(
        { error: "Missing required fields: campaignId, subscriberIds, fromEmail" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

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
    const { error: updateError } = await supabase
      .from("email_campaigns")
      .update({
        status: "sending",
        started_at: new Date().toISOString(),
        sent_count: 0,
        failed_count: 0,
        completed_at: null,
        error_message: null
      })
      .eq("id", campaignId)

    if (updateError) {
      console.error("[v0] Error updating campaign status:", updateError)
      return NextResponse.json({ 
        error: `Failed to update campaign: ${updateError.message}` 
      }, { status: 500 })
    }

    // Получаем или используем данные шаблона
    let template
    let attachments = []
    
    if (templateData) {
      template = templateData
      attachments = templateData.attachments || []
    } else if (templateId) {
      const { data: templateResult, error: templateError } = await supabase
        .from("email_templates")
        .select("*, attachments")
        .eq("id", templateId)
        .single()

      if (templateError || !templateResult) {
        console.error("[v0] Template not found:", templateError)
        
        await supabase
          .from("email_campaigns")
          .update({
            status: "failed",
            error_message: "Template not found"
          })
          .eq("id", campaignId)
          
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }
      template = templateResult
      attachments = templateResult.attachments || []
    } else {
      return NextResponse.json({ error: "Either templateId or templateData is required" }, { status: 400 })
    }

    console.log("[v0] Starting campaign:", campaignId)

    // Получаем SMTP аккаунт
    const { data: smtpAccount, error: smtpError } = await supabase
      .from("smtp_accounts")
      .select("*")
      .eq("email", fromEmail)
      .eq("is_active", true)
      .single()

    if (smtpError || !smtpAccount) {
      console.error("[v0] SMTP account not found:", smtpError)
      
      await supabase
        .from("email_campaigns")
        .update({
          status: "failed",
          error_message: "SMTP account not found"
        })
        .eq("id", campaignId)
        
      return NextResponse.json({ error: "SMTP account not found" }, { status: 404 })
    }

    // Получаем подписчиков
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

    console.log(`[v0] Found ${subscribers.length} subscribers`)

    // Создаем транспортер
    const transporter = nodemailer.createTransport({
      host: smtpAccount.smtp_host,
      port: smtpAccount.smtp_port,
      secure: smtpAccount.smtp_port === 465,
      auth: {
        user: smtpAccount.smtp_user,
        pass: smtpAccount.smtp_password,
      },
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

    // Подготавливаем вложения
    let emailAttachments = []
    if (attachments && attachments.length > 0) {
      console.log("[v0] Preparing attachments:", attachments.length)
      
      for (const attachment of attachments) {
        try {
          console.log("[v0] Downloading attachment:", attachment.name)
          
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
        }
      }
    }

    console.log("[v0] Starting email sending process...")

    // Немедленно возвращаем ответ что кампания запущена
    // Фактическая отправка происходит в фоне
    setTimeout(async () => {
      await processEmailSending(
        campaignId!,
        subscribers,
        template,
        smtpAccount,
        emailAttachments,
        supabase
      )
    }, 100)

    return NextResponse.json({ 
      success: true, 
      message: "Campaign started successfully",
      totalSubscribers: subscribers.length,
      campaignId
    })

  } catch (error) {
    console.error("[v0] Error in newsletter send:", error)
    
    if (campaignId) {
      try {
        const supabase = createAdminClient()
        await supabase
          .from("email_campaigns")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : "Unknown error"
          })
          .eq("id", campaignId)
      } catch (updateError) {
        console.error("[v0] Error updating campaign status:", updateError)
      }
    }
    
    return NextResponse.json({ 
      error: "Failed to send campaign: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 })
  }
}

// Фоновая обработка отправки писем
async function processEmailSending(
  campaignId: string,
  subscribers: any[],
  template: any,
  smtpAccount: any,
  emailAttachments: any[],
  supabase: any
) {
  let sentCount = 0
  let failedCount = 0

  try {
    const transporter = nodemailer.createTransport({
      host: smtpAccount.smtp_host,
      port: smtpAccount.smtp_port,
      secure: smtpAccount.smtp_port === 465,
      auth: {
        user: smtpAccount.smtp_user,
        pass: smtpAccount.smtp_password,
      },
    })

    const batchSize = 5
    const delayBetweenBatches = 2000

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      const batchPromises = []

      for (const subscriber of batch) {
        batchPromises.push(
          (async () => {
            try {
              console.log(`[v0] Sending email to: ${subscriber.email}`)

              // Персонализируем контент
              const personalizedHtml = personalizeContent(template.html_content, subscriber)
              const personalizedSubject = personalizeContent(template.subject, subscriber)

              const mailOptions = {
                from: `${template.from_name || smtpAccount.name} <${smtpAccount.email}>`,
                to: subscriber.email,
                subject: personalizedSubject,
                html: personalizedHtml,
                replyTo: template.reply_to || smtpAccount.email,
                attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
              }

              await transporter.sendMail(mailOptions)

              console.log(`[v0] Email sent successfully to: ${subscriber.email}`)

              // Создаем лог для отправленного письма
              try {
                await supabase
                  .from("email_campaign_logs")
                  .insert({
                    campaign_id: campaignId,
                    subscriber_id: subscriber.id,
                    email: subscriber.email,
                    status: "sent",
                    sent_at: new Date().toISOString()
                  })
              } catch (logError) {
                console.error(`[v0] Error creating log for ${subscriber.email}:`, logError)
                // Продолжаем даже если не удалось создать лог
              }

              sentCount++

            } catch (error) {
              console.error(`[v0] Failed to send to ${subscriber.email}:`, error)

              // Создаем лог для неудачного письма
              try {
                await supabase
                  .from("email_campaign_logs")
                  .insert({
                    campaign_id: campaignId,
                    subscriber_id: subscriber.id,
                    email: subscriber.email,
                    status: "failed",
                    error_message: error instanceof Error ? error.message.substring(0, 500) : "Unknown error"
                  })
              } catch (logError) {
                console.error(`[v0] Error creating failed log for ${subscriber.email}:`, logError)
              }

              failedCount++
            }
          })()
        )
      }

      // Ожидаем завершения текущего батча
      await Promise.allSettled(batchPromises)

      // Обновляем прогресс кампании
      try {
        await supabase
          .from("email_campaigns")
          .update({
            sent_count: sentCount,
            failed_count: failedCount
          })
          .eq("id", campaignId)
      } catch (updateError) {
        console.error("[v0] Error updating campaign progress:", updateError)
      }

      // Задержка между батчами
      if (i + batchSize < subscribers.length) {
        console.log(`[v0] Waiting ${delayBetweenBatches}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    // Финальный статус кампании
    let finalStatus = "sent"
    if (failedCount === subscribers.length) {
      finalStatus = "failed"
    } else if (failedCount > 0) {
      finalStatus = "sent"
    }

    // Финальное обновление кампании
    try {
      await supabase
        .from("email_campaigns")
        .update({
          status: finalStatus,
          sent_count: sentCount,
          failed_count: failedCount,
          completed_at: new Date().toISOString(),
        })
        .eq("id", campaignId)
    } catch (updateError) {
      console.error("[v0] Error finalizing campaign:", updateError)
    }

    console.log(`[v0] Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed, status: ${finalStatus}`)

  } catch (error) {
    console.error(`[v0] Error in background email processing for campaign ${campaignId}:`, error)
    
    try {
      await supabase
        .from("email_campaigns")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : "Background processing error"
        })
        .eq("id", campaignId)
    } catch (updateError) {
      console.error("[v0] Error updating failed campaign:", updateError)
    }
  }
}

// Функция для персонализации контента
function personalizeContent(content: string, subscriber: any): string {
  if (!content) return content
  
  let personalized = content
  
  personalized = personalized.replace(/{{name}}/gi, subscriber.name || '')
  personalized = personalized.replace(/{{email}}/gi, subscriber.email || '')
  personalized = personalized.replace(/{{first_name}}/gi, getFirstName(subscriber.name) || '')
  
  return personalized
}

function getFirstName(fullName: string | null): string {
  if (!fullName) return ''
  return fullName.split(' ')[0] || ''
}
