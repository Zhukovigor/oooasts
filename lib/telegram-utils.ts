// app/lib/telegram-utils.ts
import { telegramPostingConfig } from "./telegram-posting"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getTelegramConfigStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const configStatus = {
    database: {
      hasSettings: false,
      isActive: false,
      hasToken: false,
      hasChannelId: false,
    },
    environment: {
      hasToken: false,
      hasChannelId: false,
    },
    overall: {
      isConfigured: false,
      activeSource: 'none' as 'database' | 'environment' | 'none'
    }
  }

  // Проверяем настройки в базе данных
  if (supabaseUrl && supabaseKey) {
    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      })

      const { data: settings } = await supabase
        .from("telegram_posting_settings")
        .select("*")
        .limit(1)
        .single()

      if (settings) {
        configStatus.database.hasSettings = true
        configStatus.database.isActive = Boolean(settings.is_active)
        configStatus.database.hasToken = Boolean(settings.bot_token)
        configStatus.database.hasChannelId = Boolean(settings.channel_id)
      }
    } catch (error) {
      console.error("[v0] Ошибка проверки настроек БД:", error)
    }
  }

  // Проверяем настройки в переменных окружения
  configStatus.environment.hasToken = Boolean(telegramPostingConfig.getBotToken())
  configStatus.environment.hasChannelId = Boolean(telegramPostingConfig.getChannelId())

  // Определяем общий статус
  if (configStatus.database.hasSettings && configStatus.database.isActive && 
      configStatus.database.hasToken && configStatus.database.hasChannelId) {
    configStatus.overall.isConfigured = true
    configStatus.overall.activeSource = 'database'
  } else if (configStatus.environment.hasToken && configStatus.environment.hasChannelId) {
    configStatus.overall.isConfigured = true
    configStatus.overall.activeSource = 'environment'
  }

  return configStatus
}

// Функция для тестирования подключения к Telegram
export async function testTelegramConnection() {
  const botToken = telegramPostingConfig.getBotToken()
  const channelId = telegramPostingConfig.getChannelId()

  if (!botToken || !channelId) {
    return { success: false, error: "Настройки Telegram не настроены" }
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    )
    const result = await response.json()

    if (!result.ok) {
      return { success: false, error: result.description || "Ошибка подключения к Telegram" }
    }

    return { 
      success: true, 
      botInfo: result.result,
      message: "Подключение к Telegram успешно" 
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
