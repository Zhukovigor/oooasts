// В функции postToTelegram в auto-posting-service.ts
async function postToTelegram(
  data: { title: string; description: string; imageUrl?: string; postUrl?: string },
  supabase: any,
  contentType: string,
  contentId: string,
): Promise<boolean> {
  try {
    // Используем функцию с поддержкой медиа если есть изображение
    const result = data.imageUrl 
      ? await postToTelegramWithMedia(data)
      : await postToTelegramDirectly(data)

    // Сохраняем запись об успешной отправке
    const { error: insertError } = await supabase
      .from("posted_content_tracking")
      .insert({
        content_type: contentType,
        content_id: contentId,
        telegram_message_id: result.messageId,
        telegram_chat_id: result.chatId,
        status: "posted",
        posted_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error(`[v0] Ошибка сохранения записи ${contentType}/${contentId}:`, insertError)
      return false
    }

    console.log(`[v0] Успешно отправлено ${contentType}/${contentId} в Telegram`)
    return true

  } catch (error) {
    console.error(`[v0] Ошибка отправки ${contentType}/${contentId}:`, error)
    
    // Сохраняем запись об ошибке
    try {
      await supabase.from("posted_content_tracking").insert({
        content_type: contentType,
        content_id: contentId,
        status: "failed",
        error_message: String(error),
        attempted_at: new Date().toISOString(),
      })
    } catch (dbError) {
      console.error(`[v0] Ошибка сохранения ошибки для ${contentType}/${contentId}:`, dbError)
    }
    
    return false
  }
}
