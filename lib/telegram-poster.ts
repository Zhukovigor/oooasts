// app/lib/telegram-poster.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { telegramPostingConfig } from "./telegram-posting"

export async function postToTelegramDirectly(data: {
  title: string;
  description: string;
  imageUrl?: string;
  postUrl?: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Отсутствуют переменные окружения Supabase")
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
    },
  })

  // Пробуем сначала получить настройки из базы данных
  const { data: settings, error: settingsError } = await supabase
    .from("telegram_posting_settings")
    .select("*")
    .limit(1)
    .single()

  let botToken: string | null = null
  let channelId: string | number | null = null

  // Если настройки есть в базе и активны, используем их
  if (settings?.bot_token && settings?.channel_id && settings?.is_active) {
    botToken = settings.bot_token
    channelId = settings.channel_id
  } 
  // Иначе используем настройки из environment variables
  else {
    botToken = telegramPostingConfig.getBotToken()
    channelId = telegramPostingConfig.getChannelId()
    
    console.log("[v0] Используются настройки Telegram из переменных окружения")
  }

  // Проверяем наличие обязательных настроек
  if (!botToken) {
    throw new Error("Токен бота Telegram не настроен")
  }

  if (!channelId) {
    throw new Error("ID канала Telegram не настроен")
  }

  // Формируем сообщение для Telegram
  const messageText = `
<b>${data.title}</b>

${data.description}

${data.postUrl ? `<a href="${data.postUrl}">🔗 Читать далее</a>` : ''}
  `.trim()

  // Отправляем сообщение в Telegram
  const telegramResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: channelId,
        text: messageText,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    }
  )

  const result = await telegramResponse.json()
  
  if (!result.ok) {
    throw new Error(result.description || "Ошибка API Telegram")
  }

  return { 
    success: true, 
    messageId: result.result.message_id,
    chatId: result.result.chat.id
  }
}

// Новая функция для отправки с медиа (если нужно)
export async function postToTelegramWithMedia(data: {
  title: string;
  description: string;
  imageUrl?: string;
  postUrl?: string;
}) {
  const botToken = telegramPostingConfig.getBotToken()
  const channelId = telegramPostingConfig.getChannelId()

  if (!botToken || !channelId) {
    throw new Error("Настройки Telegram не настроены")
  }

  // Если есть изображение, можно отправить как фото с подписью
  if (data.imageUrl) {
    const caption = `
<b>${data.title}</b>

${data.description}

${data.postUrl ? `<a href="${data.postUrl}">🔗 Читать далее</a>` : ''}
    `.trim()

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          photo: data.imageUrl,
          caption: caption,
          parse_mode: "HTML",
        }),
      }
    )

    const result = await telegramResponse.json()
    
    if (!result.ok) {
      // Если отправка фото не удалась, пробуем отправить просто текст
      console.log("[v0] Ошибка отправки фото, пробуем текстовое сообщение")
      return await postToTelegramDirectly(data)
    }

    return { 
      success: true, 
      messageId: result.result.message_id,
      chatId: result.result.chat.id
    }
  }

  // Если нет изображения, отправляем обычное сообщение
  return await postToTelegramDirectly(data)
}
