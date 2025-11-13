import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function addToPostingQueue(
  contentType: string,
  contentId: string,
  title: string,
  description: string,
  imageUrl: string,
  contentUrl: string,
) {
  const supabase = createClientComponentClient()

  try {
    const { data, error } = await supabase
      .from("posting_queue")
      .insert({
        content_type: contentType,
        content_id: contentId,
        title,
        description,
        image_url: imageUrl,
        content_url: contentUrl,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error adding to posting queue:", error)
    return { success: false, error }
  }
}

export async function postTelegram(
  botToken: string,
  channelId: bigint,
  title: string,
  description: string,
  imageUrl: string,
  contentUrl: string,
) {
  try {
    const message = `<b>${title}</b>\n\n${description}\n\n<a href="${contentUrl}">Подробнее</a>`

    if (imageUrl) {
      // Post with photo
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          photo: imageUrl,
          caption: message,
          parse_mode: "HTML",
        }),
      })
      return await response.json()
    } else {
      // Post text only
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          text: message,
          parse_mode: "HTML",
        }),
      })
      return await response.json()
    }
  } catch (error) {
    console.error("[v0] Error posting to telegram:", error)
    throw error
  }
}
