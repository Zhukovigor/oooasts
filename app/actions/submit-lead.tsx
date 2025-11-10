"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function submitLead(formData: {
  name: string
  phone: string
  email: string
  message: string
}) {
  try {
    const supabase = createAdminClient()

    // Insert lead into database
    const { data: lead, error: dbError } = await supabase
      .from("leads")
      .insert({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        message: formData.message,
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return { success: false, error: "Failed to save lead" }
    }

    if (formData.email) {
      const emailHtml = `
        <h2>Спасибо за вашу заявку!</h2>
        <p><strong>Имя:</strong> ${formData.name}</p>
        <p><strong>Телефон:</strong> ${formData.phone}</p>
        <p><strong>Сообщение:</strong> ${formData.message}</p>
        <p><strong>ID заявки:</strong> ${lead.id}</p>
        <p>Мы свяжемся с вами в ближайшее время.</p>
      `

      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        await fetch(`${siteUrl}/api/notifications/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: formData.email,
            subject: "Ваша заявка получена",
            html: emailHtml,
            adminEmail: process.env.ADMIN_EMAIL || "Zhukovigor@mail.ru",
          }),
        })
      } catch (emailError) {
        console.error("[v0] Email send error:", emailError)
      }
    }

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
    const telegramChatIdsStr = process.env.TELEGRAM_CHAT_IDS

    if (telegramBotToken && telegramChatIdsStr) {
      // Parse comma-separated chat IDs
      const chatIds = telegramChatIdsStr.split(",").map((id) => id.trim())

      const message = `
🆕 Новая заявка ЗАЯВКУ НА ТЕХНИКУ!

👤 Имя: ${formData.name}
📞 Телефон: ${formData.phone}
📧 Email: ${formData.email}
${formData.message ? `💬 Сообщение: ${formData.message}` : ""}

🆔 ID заявки: ${lead.id}
      `.trim()

      try {
        for (const chatId of chatIds) {
          const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: Number.parseInt(chatId, 10),
              text: message,
              parse_mode: "HTML",
            }),
          })

          if (telegramResponse.ok) {
            const telegramData = await telegramResponse.json()
            await supabase
              .from("leads")
              .update({
                telegram_sent: true,
                telegram_message_id: telegramData.result.message_id.toString(),
              })
              .eq("id", lead.id)

            console.log("[v0] Telegram message sent to chat", chatId)
          } else {
            const errorText = await telegramResponse.text()
            console.error("[v0] Telegram error for chat", chatId, ":", errorText)
          }
        }
      } catch (telegramError) {
        console.error("[v0] Telegram send error:", telegramError)
      }
    } else {
      console.warn("[v0] Telegram credentials not configured")
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Submit lead error:", error)
    return { success: false, error: "Internal server error" }
  }
}
