import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

interface TelegramChannel {
  id: string
  bot_token: string
  channel_id: bigint
  channel_name: string
  is_active: boolean
}

interface PostToChannelsOptions {
  title: string
  description?: string
  imageUrl?: string
  postUrl?: string
  contentType: "catalog" | "article" | "advertisement"
  contentId: string
  buttonText?: string
  selectedChannels?: string[] // Массив ID каналов для постинга
}

export async function getActiveTelegramChannels() {
  const cookieStore = await cookies()
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

  const { data, error } = await supabase
    .from("telegram_posting_settings")
    .select("*")
    .eq("is_active", true)

  if (error) {
    console.error("[v0] Error fetching telegram channels:", error)
    return []
  }

  return data as TelegramChannel[]
}

export async function getContentChannelSettings(contentType: string) {
  const cookieStore = await cookies()
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

  const { data, error } = await supabase
    .from("content_channel_mapping")
    .select("channel_id, auto_post")
    .eq("content_type", contentType)
    .eq("auto_post", true)

  if (error) {
    console.error("[v0] Error fetching content channel settings:", error)
    return []
  }

  return data
}

export async function postToMultipleChannels(options: PostToChannelsOptions) {
  const {
    title,
    description,
    imageUrl,
    postUrl,
    contentType,
    contentId,
    buttonText,
    selectedChannels,
  } = options

  const channels = selectedChannels
    ? await getActiveTelegramChannels().then(all => all.filter(c => selectedChannels.includes(c.id)))
    : await getActiveTelegramChannels()

  const cookieStore = await cookies()
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

  const results = []

  for (const channel of channels) {
    try {
      const message = `<b>${title}</b>\n\n${description || ""}`

      const basePayload: any = {
        chat_id: channel.channel_id,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }

      if (postUrl) {
        basePayload.reply_markup = {
          inline_keyboard: [[{ text: buttonText || "📖 Читать далее", url: postUrl }]],
        }
      }

      let messageId: number | null = null
      let success = false

      if (imageUrl) {
        const photoUrl = `https://api.telegram.org/bot${channel.bot_token}/sendPhoto`
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
        success = photoData.ok
        messageId = photoData.result?.message_id || null
      } else {
        const telegramUrl = `https://api.telegram.org/bot${channel.bot_token}/sendMessage`
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
        success = data.ok
        messageId = data.result?.message_id || null
      }

      // Записываем результат в базу
      if (success) {
        await supabase.from("posted_content_channels").insert({
          content_type: contentType,
          content_id: contentId,
          channel_id: channel.id,
          telegram_message_id: messageId,
          status: "sent",
        })
      } else {
        await supabase.from("posted_content_channels").insert({
          content_type: contentType,
          content_id: contentId,
          channel_id: channel.id,
          status: "failed",
          error_message: "Failed to send",
        })
      }

      results.push({
        channelId: channel.id,
        channelName: channel.channel_name,
        success,
        messageId,
      })
    } catch (error) {
      console.error(`[v0] Error posting to channel ${channel.channel_name}:`, error)
      results.push({
        channelId: channel.id,
        channelName: channel.channel_name,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}
