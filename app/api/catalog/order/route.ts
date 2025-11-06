import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelId, modelName, name, phone, email, comment } = body

    // Validate required fields
    if (!modelId || !modelName || !name || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

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
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    if (email) {
      const emailHtml = `
        <h2>Спасибо за вашу заявку!</h2>
        <p><strong>Модель:</strong> ${modelName}</p>
        <p><strong>Имя:</strong> ${name}</p>
        <p><strong>Телефон:</strong> ${phone}</p>
        ${comment ? `<p><strong>Комментарий:</strong> ${comment}</p>` : ""}
        <p><strong>ID заявки:</strong> ${order.id}</p>
      `

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        await fetch(`${siteUrl}/api/notifications/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: "Ваша заявка получена",
            html: emailHtml,
            adminEmail: process.env.ADMIN_EMAIL || "admin@asts.ru",
          }),
        })
      } catch (emailError) {
        console.error("[v0] Email send error:", emailError)
      }
    }

    // Send to Telegram
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
    const telegramChatId = process.env.TELEGRAM_CHAT_ID

    if (telegramBotToken && telegramChatId) {
      const message = `
🆕 Новая заявка из каталога!

📦 Модель: ${modelName}
👤 Имя: ${name}
📞 Телефон: ${phone}
${email ? `📧 Email: ${email}` : ""}
${comment ? `💬 Комментарий: ${comment}` : ""}

🆔 ID заявки: ${order.id}
      `.trim()

      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: message,
            parse_mode: "HTML",
          }),
        })

        if (telegramResponse.ok) {
          const telegramData = await telegramResponse.json()
          await supabase
            .from("catalog_orders")
            .update({
              telegram_sent: true,
              telegram_message_id: telegramData.result.message_id.toString(),
            })
            .eq("id", order.id)
        } else {
          console.error("[v0] Telegram API error:", await telegramResponse.text())
        }
      } catch (telegramError) {
        console.error("[v0] Telegram send error:", telegramError)
      }
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error) {
    console.error("[v0] Order API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
