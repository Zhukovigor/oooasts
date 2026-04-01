// app/api/newsletter/send/route.ts
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Конфигурация
const BATCH_SIZE = 3 // Уменьшим размер батча для большей надежности
const DELAY_BETWEEN_BATCHES = 3000 // 3 секунды между батчами
const MAX_RETRIES = 2 // Максимальное количество повторных попыток

export async function POST(request: NextRequest) {
  let campaignId: string | null = null

  try {
    const { campaignId: requestCampaignId, templateId, subscriberIds, fromEmail, templateData } = await request.json()
    campaignId = requestCampaignId

    // Валидация обязательных полей
    if (!campaignId || !subscriberIds || !fromEmail) {
      return NextResponse.json(
        { error: "Missing required fields: campaignId, subscriberIds, fromEmail" },
        { status: 400 },
      )
    }

    if (!Array.isArray(subscriberIds) || subscriberIds.length === 0) {
      return NextResponse.json({ error: "subscriberIds must be a non-empty array" }, { status: 400 })
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
    if (campaign.status === "sent" || campaign.status === "sending") {
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
        error_message: null,
      })
      .eq("id", campaignId)

    if (updateError) {
      console.error("[v0] Error updating campaign status:", updateError)
      return NextResponse.json(
        {
          error: `Failed to update campaign: ${updateError.message}`,
        },
        { status: 500 },
      )
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
            error_message: "Template not found",
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
    console.log("[v0] Subscribers to send:", subscriberIds.length)

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
          error_message: "SMTP account not found",
        })
        .eq("id", campaignId)

      return NextResponse.json({ error: "SMTP account not found" }, { status: 404 })
    }

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
          error_message: "No subscribers found",
        })
        .eq("id", campaignId)

      return NextResponse.json({ error: "No subscribers found" }, { status: 404 })
    }

    console.log(`[v0] Found ${subscribers.length} subscribers`)

    try {
      const campaignLogs = subscribers.map((subscriber) => ({
        campaign_id: campaignId,
        contact_id: subscriber.id,
        email: subscriber.email,
        status: "pending",
        sent_at: null,
        error_message: null,
      }))

      // Сначала удаляем старые логи если они существуют
      await supabase.from("email_campaign_logs").delete().eq("campaign_id", campaignId)

      const { error: logsError } = await supabase.from("email_campaign_logs").insert(campaignLogs)

      if (logsError) {
        console.error("[v0] Error creating campaign logs:", logsError)
        throw new Error(`Failed to create campaign logs: ${logsError.message}`)
      }

      console.log("[v0] Campaign logs created successfully")
    } catch (error) {
      console.error("[v0] Error in campaign logs setup:", error)

      await supabase
        .from("email_campaigns")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Failed to setup campaign logs",
        })
        .eq("id", campaignId)

      return NextResponse.json(
        {
          error: "Failed to setup campaign logs",
        },
        { status: 500 },
      )
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
          error_message: "SMTP connection failed",
        })
        .eq("id", campaignId)

      return NextResponse.json({ error: "SMTP connection failed" }, { status: 500 })
    }

    // Подготавливаем вложения
    const emailAttachments = []
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
            contentType: attachment.type,
          })

          console.log("[v0] Attachment prepared:", attachment.name)
        } catch (error) {
          console.error("[v0] Error preparing attachment:", attachment.name, error)
          // Продолжаем без этого вложения
        }
      }
    }

    console.log("[v0] Starting email sending process...")

    // Немедленно возвращаем ответ что кампания запущена
    const processSendingPromise = processEmailSending(
      campaignId!,
      subscribers,
      template,
      smtpAccount,
      emailAttachments,
      supabase,
    )
    await Promise.allSettled([processSendingPromise])

    return NextResponse.json({
      success: true,
      message: "Campaign started successfully",
      totalSubscribers: subscribers.length,
      campaignId,
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
            error_message: error instanceof Error ? error.message : "Unknown error",
          })
          .eq("id", campaignId)
      } catch (updateError) {
        console.error("[v0] Error updating campaign status:", updateError)
      }
    }

    return NextResponse.json(
      {
        error: "Failed to send campaign: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

// Фоновая обработка отправки писем
async function processEmailSending(
  campaignId: string,
  subscribers: any[],
  template: any,
  smtpAccount: any,
  emailAttachments: any[],
  supabase: any,
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

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE)

      // Проверяем не остановлена ли кампания
      const { data: currentCampaign } = await supabase
        .from("email_campaigns")
        .select("status")
        .eq("id", campaignId)
        .single()

      if (currentCampaign?.status === "failed") {
        console.log("[v0] Campaign marked as failed (stopped), aborting sending...")
        break
      }

      const batchResults = await processBatch(
        batch,
        campaignId,
        template,
        smtpAccount,
        emailAttachments,
        transporter,
        supabase,
      )

      sentCount += batchResults.sentCount
      failedCount += batchResults.failedCount

      // Обновляем прогресс кампании
      try {
        await supabase
          .from("email_campaigns")
          .update({
            sent_count: sentCount,
            failed_count: failedCount,
          })
          .eq("id", campaignId)
      } catch (updateError) {
        console.error("[v0] Error updating campaign progress:", updateError)
      }

      // Задержка между батчами
      if (i + BATCH_SIZE < subscribers.length) {
        console.log(`[v0] Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`)
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
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
    await supabase
      .from("email_campaigns")
      .update({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaignId)

    console.log(
      `[v0] Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed, status: ${finalStatus}`,
    )
  } catch (error) {
    console.error(`[v0] Error in background email processing for campaign ${campaignId}:`, error)

    await supabase
      .from("email_campaigns")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Background processing error",
      })
      .eq("id", campaignId)
  }
}

// Обработка одного батча писем
async function processBatch(
  batch: any[],
  campaignId: string,
  template: any,
  smtpAccount: any,
  emailAttachments: any[],
  transporter: any,
  supabase: any,
): Promise<{ sentCount: number; failedCount: number }> {
  let sentCount = 0
  let failedCount = 0

  const batchPromises = batch.map((subscriber) =>
    sendEmailWithRetry(
      subscriber,
      campaignId,
      template,
      smtpAccount,
      emailAttachments,
      transporter,
      supabase,
      MAX_RETRIES,
    ),
  )

  const results = await Promise.allSettled(batchPromises)

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      if (result.value.success) {
        sentCount++
      } else {
        failedCount++
      }
    } else {
      failedCount++
    }
  })

  return { sentCount, failedCount }
}

// Отправка email с повторными попытками
async function sendEmailWithRetry(
  subscriber: any,
  campaignId: string,
  template: any,
  smtpAccount: any,
  emailAttachments: any[],
  transporter: any,
  supabase: any,
  retries: number,
): Promise<{ success: boolean }> {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      console.log(`[v0] Sending email to: ${subscriber.email} (attempt ${attempt})`)

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

      await supabase
        .from("email_campaign_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("campaign_id", campaignId)
        .eq("contact_id", subscriber.id)

      return { success: true }
    } catch (error) {
      console.error(`[v0] Failed to send to ${subscriber.email} (attempt ${attempt}):`, error)

      if (attempt <= retries) {
        // Ждем перед повторной попыткой
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        continue
      }

      await supabase
        .from("email_campaign_logs")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message.substring(0, 500) : "Unknown error",
        })
        .eq("campaign_id", campaignId)
        .eq("contact_id", subscriber.id)

      return { success: false }
    }
  }

  return { success: false }
}

// Функция для персонализации контента
function personalizeContent(content: string, subscriber: any): string {
  if (!content) return content

  let personalized = content

  personalized = personalized.replace(/{{name}}/gi, subscriber.name || "")
  personalized = personalized.replace(/{{email}}/gi, subscriber.email || "")
  personalized = personalized.replace(/{{first_name}}/gi, getFirstName(subscriber.name) || "")

  return personalized
}

function getFirstName(fullName: string | null): string {
  if (!fullName) return ""
  return fullName.split(" ")[0] || ""
}
