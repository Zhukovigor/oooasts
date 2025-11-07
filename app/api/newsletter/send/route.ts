// app/api/newsletter/send/route.ts
import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Разрешенные статусы кампании
const ALLOWED_CAMPAIGN_STATUSES = ['draft', 'sending', 'sent', 'failed', 'stopped', 'partial'] as const

export async function POST(request: Request) {
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

    const supabase = await createServerClient()

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

    // Проверяем валидность текущего статуса
    if (!ALLOWED_CAMPAIGN_STATUSES.includes(campaign.status as any)) {
      console.error("[v0] Invalid campaign status:", campaign.status)
      return NextResponse.json({ error: "Invalid campaign status" }, { status: 400 })
    }

    // Проверяем статус кампании - разрешаем переотправку только из определенных статусов
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      console.log(`[v0] Campaign ${campaignId} already in status: ${campaign.status}`)
      
      // Если кампания в процессе отправки, проверяем можно ли продолжить
      if (campaign.status === 'sending') {
        const { data: logs } = await supabase
          .from("email_campaign_logs")
          .select("status")
          .eq("campaign_id", campaignId)
        
        const sentCount = logs?.filter(log => log.status === 'sent').length || 0
        
        // Если уже есть отправленные письма, не разрешаем перезапуск
        if (sentCount > 0) {
          return NextResponse.json({ 
            error: `Campaign already in progress (${sentCount} sent). Please wait for completion or stop it first.` 
          }, { status: 400 })
        }
      } else {
        return NextResponse.json({ 
          error: "Campaign already sent. Create a new campaign to send again." 
        }, { status: 400 })
      }
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
        return NextResponse.json({ error: "Template not found" }, { status: 404 })
      }
      template = templateResult
      attachments = templateResult.attachments || []
    } else {
      return NextResponse.json({ error: "Either templateId or templateData is required" }, { status: 400 })
    }

    console.log("[v0] Starting campaign:", campaignId)
    console.log("[v0] Subscribers to send:", subscriberIds.length)
    console.log("[v0] Template attachments:", attachments.length)

    // Очищаем старые логи кампании если это перезапуск
    if (['failed', 'stopped', 'draft'].includes(campaign.status)) {
      console.log("[v0] Cleaning up old campaign logs...")
      await supabase
        .from("email_campaign_logs")
        .delete()
        .eq("campaign_id", campaignId)
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

    // Fetch SMTP account
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

    // Fetch subscribers
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

    // Создаем начальные логи кампании
    const campaignLogs = subscribers.map(subscriber => ({
      campaign_id: campaignId,
      subscriber_id: subscriber.id,
      email: subscriber.email,
      status: 'pending',
      sent_at: null,
      error_message: null
    }))

    const { error: logsError } = await supabase
      .from("email_campaign_logs")
      .insert(campaignLogs)

    if (logsError) {
      console.error("[v0] Error creating campaign logs:", logsError)
      
      await supabase
        .from("email_campaigns")
        .update({
          status: "failed",
          error_message: "Failed to create campaign logs"
        })
        .eq("id", campaignId)
        
      return NextResponse.json({ error: "Failed to create campaign logs" }, { status: 500 })
    }

    // Создаем транспортер
    const transporter = nodemailer.createTransport({
      host: smtpAccount.smtp_host,
      port: smtpAccount.smtp_port,
      secure: smtpAccount.smtp_port === 465,
      auth: {
        user: smtpAccount.smtp_user,
        pass: smtpAccount.smtp_password,
      },
      connectionTimeout: 30000,
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
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    })

    const batchSize = 3
    const delayBetweenBatches = 3000

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      const batchPromises = []

      // Проверяем не остановлена ли кампания
      const { data: currentCampaign } = await supabase
        .from("email_campaigns")
        .select("status")
        .eq("id", campaignId)
        .single()

      if (currentCampaign?.status === 'stopped') {
        console.log("[v0] Campaign stopped, aborting sending...")
        break
      }

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

              // Обновляем лог
              await supabase
                .from("email_campaign_logs")
                .update({
                  status: "sent",
                  sent_at: new Date().toISOString()
                })
                .eq("campaign_id", campaignId)
                .eq("subscriber_id", subscriber.id)

              sentCount++

            } catch (error) {
              console.error(`[v0] Failed to send to ${subscriber.email}:`, error)

              await supabase
                .from("email_campaign_logs")
                .update({
                  status: "failed",
                  error_message: error instanceof Error ? error.message.substring(0, 500) : "Unknown error"
                })
                .eq("campaign_id", campaignId)
                .eq("subscriber_id", subscriber.id)

              failedCount++
            }
          })()
        )
      }

      // Ожидаем завершения текущего батча
      await Promise.allSettled(batchPromises)

      // Обновляем прогресс кампании
      await supabase
        .from("email_campaigns")
        .update({
          sent_count: sentCount,
          failed_count: failedCount
        })
        .eq("id", campaignId)

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
      finalStatus = "partial"
    }

    // Проверяем не остановлена ли кампания
    const { data: finalCampaign } = await supabase
      .from("email_campaigns")
      .select("status")
      .eq("id", campaignId)
      .single()

    // Если кампания была остановлена, сохраняем этот статус
    if (finalCampaign?.status === 'stopped') {
      finalStatus = 'stopped'
    }

    await supabase
      .from("email_campaigns")
      .update({
        sent_count: sentCount,
        failed_count: failedCount,
        status: finalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaignId)

    console.log(`[v0] Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed, status: ${finalStatus}`)

  } catch (error) {
    console.error(`[v0] Error in background email processing for campaign ${campaignId}:`, error)
    
    await supabase
      .from("email_campaigns")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Background processing error"
      })
      .eq("id", campaignId)
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
