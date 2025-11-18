import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { title, description, imageUrl, postUrl, contentType, contentId, buttonText, channelIds } =
      await request.json()

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    // Получаем все выбранные каналы с их параметрами
    const { data: channels } = await supabase
      .from("telegram_posting_settings")
      .select("*")
      .in("id", channelIds)
      .eq("is_active", true)

    if (!channels || channels.length === 0) {
      return NextResponse.json({ error: "Channels not found" }, { status: 400 })
    }

    const results = []

    for (const channel of channels) {
      try {
        const botToken = channel.bot_token
        const chatId = channel.channel_id

        // Формируем текст с заголовком и описанием
        const messageText = `<b>${title}</b>\n\n${description}`
        
        let apiMethod = "sendMessage"
        let payload: any = {
          chat_id: chatId,
          text: messageText,
          parse_mode: "HTML",
        }

        // Если есть изображение, используем sendPhoto с подписью
        if (imageUrl) {
          apiMethod = "sendPhoto"
          payload = {
            chat_id: chatId,
            photo: imageUrl,
            caption: messageText,
            parse_mode: "HTML",
          }
        }

        // Если это тема в группе, добавляем message_thread_id
        if (channel.is_thread && channel.thread_id) {
          payload.message_thread_id = channel.thread_id
        }

        // Если есть кнопка с ссылкой
        if (postUrl) {
          payload.reply_markup = {
            inline_keyboard: [
              [
                {
                  text: buttonText || "Подробнее",
                  url: postUrl,
                },
              ],
            ],
          }
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/${apiMethod}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.description || "Telegram API error")
        }

        results.push({
          success: true,
          channelName: channel.channel_name,
          messageId: data.result.message_id,
          isThread: channel.is_thread,
          hasPhoto: !!imageUrl,
        })

        await supabase.from("posted_content_channels").upsert({
          content_type: contentType,
          content_id: contentId,
          channel_id: channel.id,
          telegram_message_id: data.result.message_id,
          thread_id: channel.thread_id || null,
          is_thread_post: channel.is_thread || false,
          status: "sent",
        })
      } catch (error: any) {
        console.error(`[v0] Error posting to channel ${channel.channel_name}:`, error)
        results.push({
          success: false,
          channelName: channel.channel_name,
          error: error.message,
          isThread: channel.is_thread,
        })
      }
    }

    const allSuccess = results.every((r) => r.success)

    return NextResponse.json({
      success: allSuccess,
      results,
    })
  } catch (error) {
    console.error("[v0] Error in multi-channel posting:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
