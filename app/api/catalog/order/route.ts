import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import { calculateLeadScore } from "@/app/lib/lead-scoring"
import { telegramBotToken, getTelegramChatIds } from "@/app/config/telegram"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelId, modelName, name, phone, email, comment } = body

    // Validate required fields
    if (!modelId || !modelName || !name || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const leadScoring = calculateLeadScore({
      source: "catalog_order",
      hasEmail: !!email,
      hasPhone: !!phone,
      comment: comment,
      modelName: modelName,
      customerName: name,
    })

    // Insert order into database
    const { data: order, error: dbError } = await supabase
      .from("catalog_orders")
      .insert({
        model_id: modelId,
        model_name: modelName,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        customer_comment: comment || null,
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        lead_score: leadScoring.totalScore,
        lead_temperature: leadScoring.temperature,
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    await supabase
      .from("lead_scoring")
      .insert({
        order_id: order.id,
        score: leadScoring.totalScore,
        source_score: leadScoring.breakdown.sourceScore,
        contact_quality_score: leadScoring.breakdown.contactQualityScore,
        message_quality_score: leadScoring.breakdown.messageQualityScore,
        response_potential_score: leadScoring.breakdown.responsePotentialScore,
        scoring_notes: `${leadScoring.temperature.toUpperCase()} - Score: ${leadScoring.totalScore}/100`,
      })
      .catch((err) => console.error("[v0] Lead scoring insert error:", err))

    if (email) {
      const emailSubject =
        leadScoring.temperature === "hot"
          ? "Спасибо за интерес к нашей технике! Свяжемся с вами в ближайшее время"
          : "Ваша заявка получена - подтверждение"

      const emailHtml = `
        <h2>Спасибо за вашу заявку!</h2>
        <p>Уважаемый/ая ${name},</p>
        <p>Мы получили вашу заявку на модель <strong>${modelName}</strong>.</p>
        
        <p><strong>Данные заявки:</strong></p>
        <ul>
          <li><strong>Модель:</strong> ${modelName}</li>
          <li><strong>Телефон:</strong> ${phone}</li>
          ${comment ? `<li><strong>Ваше сообщение:</strong> ${comment}</li>` : ""}
          <li><strong>Номер заявки:</strong> ${order.id}</li>
        </ul>

        ${
          leadScoring.temperature === "hot"
            ? '<p><strong style="color: #d32f2f;">Приоритет:</strong> Ваша заявка отмечена как приоритетная. Мы свяжемся с вами в ближайшее время.</p>'
            : "<p>Наш менеджер обработает вашу заявку в течение 24 часов.</p>"
        }

        <p>Если у вас возникли вопросы, напишите нам в ответ на это письмо.</p>
        <p>С уважением,<br/>Команда ООО АСТС</p>
      `

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        await fetch(`${siteUrl}/api/notifications/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: emailSubject,
            html: emailHtml,
            adminEmail: process.env.ADMIN_EMAIL || "Zhukovigor@mail.ru",
          }),
        })

        // Mark auto-responder as sent
        await supabase
          .from("catalog_orders")
          .update({
            auto_responder_sent: true,
            auto_responder_sent_at: new Date().toISOString(),
          })
          .eq("id", order.id)
      } catch (emailError) {
        console.error("[v0] Email send error:", emailError)
      }
    }

    if (telegramBotToken) {
      const chatIds = getTelegramChatIds()

      console.log("[v0] Telegram config check:", {
        hasBotToken: !!telegramBotToken,
        botTokenLength: telegramBotToken?.length || 0,
        chatIdsCount: chatIds.length,
        chatIds: chatIds,
      })

      if (chatIds.length === 0) {
        console.warn("[v0] No Telegram chat IDs configured - skipping telegram notification")
      } else {
        for (const chatId of chatIds) {
          const message = `
🆕 Новая заявка из каталога!

📦 Модель: ${modelName}
👤 Имя: ${name}
📞 Телефон: ${phone}
${email ? `📧 Email: ${email}` : ""}
${comment ? `💬 Комментарий: ${comment}` : ""}
🌡 Качество: ${leadScoring.temperature.toUpperCase()} (${leadScoring.totalScore}/100)

🆔 ID заявки: ${order.id}
          `.trim()

          try {
            console.log("[v0] Sending telegram message to chat:", chatId)
            const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "HTML",
              }),
            })

            const telegramData = await telegramResponse.json()
            console.log("[v0] Telegram response:", {
              ok: telegramResponse.ok,
              status: telegramResponse.status,
              data: telegramData,
            })

            if (telegramResponse.ok) {
              console.log("[v0] Telegram message sent successfully to", chatId)
              await supabase
                .from("catalog_orders")
                .update({
                  telegram_sent: true,
                  telegram_message_id: telegramData.result.message_id.toString(),
                })
                .eq("id", order.id)
            } else {
              console.error("[v0] Telegram API error:", telegramData)
            }
          } catch (telegramError) {
            console.error("[v0] Telegram send error:", telegramError)
          }
        }
      }
    } else {
      console.warn("[v0] Telegram bot token not configured - skipping telegram notifications")
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      leadTemperature: leadScoring.temperature,
      leadScore: leadScoring.totalScore,
    })
  } catch (error) {
    console.error("[v0] Order API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
