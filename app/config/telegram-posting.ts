export const telegramPostingConfig = {
  getBotToken: () => process.env.TELEGRAM_BOT_TOKEN || "",
  getChannelId: () => {
    const channelId = process.env.TELEGRAM_CHANNEL_ID
    if (!channelId) return null
    return Number.isNaN(Number(channelId)) ? channelId : Number(channelId)
  },
}
