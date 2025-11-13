import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { title, description, imageUrl, postUrl, channelId: overrideChannelId } = await request.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const { data: settings } = await supabase.from("telegram_posting_settings").select("*").limit(1).single()

    const botToken = settings?.bot_token
    const channelId = overrideChannelId || settings?.channel_id

    if (!botToken || !channelId) {
      console.error("[v0] Telegram configuration missing: token=" + !!botToken + ", channelId=" + !!channelId)
      return NextResponse.json({ error: "Telegram configuration not found in database" }, { status: 400 })
    }

    const message = `📢 <b>${title}</b>\n\n${description || ""}\n\n${postUrl ? `<a href="${postUrl}">Подробнее</a>` : ""}`

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
      console.log("[v0] Telegram photo response:", photoData)

      if (!photoData.ok) {
        console.error("[v0] Telegram error:", photoData)
        return NextResponse.json({ error: `Telegram error: ${photoData.description}` }, { status: 400 })
      }

      return NextResponse.json({ success: true, messageId: photoData.result.message_id })
    } else {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
      const payload = {
        chat_id: channelId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }

      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log("[v0] Telegram message response:", data)

      if (!data.ok) {
        console.error("[v0] Telegram error:", data)
        return NextResponse.json({ error: `Telegram error: ${data.description}` }, { status: 400 })
      }

      return NextResponse.json({ success: true, messageId: data.result.message_id })
    }
  } catch (error) {
    console.error("[v0] Error posting to Telegram:", error)
    return NextResponse.json({ error: `Internal server error: ${error}` }, { status: 500 })
  }
}
