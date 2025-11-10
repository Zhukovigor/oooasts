export const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
export const telegramChatIds = process.env.TELEGRAM_CHAT_IDS

// Parse multiple chat IDs separated by comma
export function getTelegramChatIds(): number[] {
  if (!telegramChatIds) return []
  return telegramChatIds
    .split(",")
    .map((id) => {
      const parsed = Number.parseInt(id.trim(), 10)
      return isNaN(parsed) ? null : parsed
    })
    .filter((id) => id !== null) as number[]
}
