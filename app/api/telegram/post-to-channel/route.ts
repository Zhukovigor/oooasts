import { type NextRequest, NextResponse } from "next/server"
import { telegramPostingConfig } from "@/app/config/telegram-posting"

export async function POST(request: NextRequest) {
  try {
    const { title, description, imageUrl, postUrl, channelId: overrideChannelId } = await request.json()

    const botToken = telegramPostingConfig.getBotToken()
    const channelId = overrideChannelId || telegramPostingConfig.getChannelId()

    if (!botToken || !channelId) {
      console.error("[v0] Telegram configuration missing")
      return NextResponse.json({ error: "Telegram configuration not found" }, { status: 400 })
    }

    const message = `📢 <b>${title}</b>\n\n${description || ""}\n\n${postUrl ? `<a href="${postUrl}">Подробнее</a>` : ""}`

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

    const payload: any = {
      chat_id: channelId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }

    if (imageUrl) {
      const photoUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`
      const photoPayload = {
        chat_id: channelId,
        photo: imageUrl,
        caption: message,
        parse_mode: "HTML",
      }

      const photoResponse = await fetch(photoUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoPayload),
      })

      const photoData = await photoResponse.json()
      console.log("[v0] Telegram photo sent:", photoData)

      if (!photoData.ok) {
        console.error("[v0] Telegram error:", photoData)
        return NextResponse.json({ error: "Failed to send to Telegram" }, { status: 500 })
      }

      return NextResponse.json({ success: true, messageId: photoData.result.message_id })
    } else {
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log("[v0] Telegram message sent:", data)

      if (!data.ok) {
        console.error("[v0] Telegram error:", data)
        return NextResponse.json({ error: "Failed to send to Telegram" }, { status: 500 })
      }

      return NextResponse.json({ success: true, messageId: data.result.message_id })
    }
  } catch (error) {
    console.error("[v0] Error posting to Telegram:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
