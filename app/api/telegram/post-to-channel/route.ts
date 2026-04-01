// app/api/telegram/post-to-channel/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// ДОБАВЬТЕ поддержку POST метода
export async function POST(request: NextRequest) {
  try {
    const { title, description, imageUrl, postUrl, channelId: overrideChannelId, withInlineButton, buttonText } = await request.json()

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
      console.error("[v0] Telegram configuration missing")
      return NextResponse.json({ error: "Telegram configuration not found" }, { status: 400 })
    }

    // Формируем текст БЕЗ ссылки
    const message = `<b>${title}</b>\n\n${description || ""}`

    const basePayload: any = {
      chat_id: channelId,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }

    // Добавляем инлайн кнопку
    if (postUrl) {
      basePayload.reply_markup = {
        inline_keyboard: [
          [
            {
              text: buttonText || "📖 Читать далее",
              url: postUrl
            }
          ]
        ]
      }
    }

    if (imageUrl) {
      const photoUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`
      const photoPayload = {
        ...basePayload,
        photo: imageUrl,
        caption: message,
      }

      const photoResponse = await fetch(photoUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoPayload),
      })

      const photoData = await photoResponse.json()

      if (!photoData.ok) {
        return NextResponse.json({ error: `Telegram error: ${photoData.description}` }, { status: 400 })
      }

      return NextResponse.json({ success: true, messageId: photoData.result.message_id })
    } else {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
      const payload = {
        ...basePayload,
        text: message,
      }

      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!data.ok) {
        return NextResponse.json({ error: `Telegram error: ${data.description}` }, { status: 400 })
      }

      return NextResponse.json({ success: true, messageId: data.result.message_id })
    }
  } catch (error) {
    console.error("[v0] Error posting to Telegram:", error)
    return NextResponse.json({ error: `Internal server error: ${error}` }, { status: 500 })
  }
}

// ДОБАВЬТЕ также GET метод для тестирования
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Use POST method to send messages to Telegram",
    example: {
      title: "Test message",
      description: "This is a test message",
      postUrl: "https://example.com",
      withInlineButton: true,
      buttonText: "📖 Read more"
    }
  })
}
