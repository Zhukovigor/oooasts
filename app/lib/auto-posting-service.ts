// В файле auto-posting-service.ts исправьте функцию postToTelegram:
async function postToTelegram(
  data: { title: string; description: string; imageUrl?: string; postUrl?: string },
  supabase: any,
  contentType: string,
  contentId: string,
) {
  try {
    // Use absolute URL for API call
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://volgograd-asts.vercel.app"
    const response = await fetch(`${baseUrl}/api/telegram/post-to-channel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (result.success) {
      // Save tracking record
      await supabase.from("posted_content_tracking").insert({
        content_type: contentType,
        content_id: contentId,
        telegram_message_id: result.messageId,
        status: "posted",
      })
      console.log(`[v0] Posted ${contentType}/${contentId} to Telegram`)
    } else {
      // Save error record
      await supabase.from("posted_content_tracking").insert({
        content_type: contentType,
        content_id: contentId,
        status: "failed",
        error_message: result.error,
      })
      console.error(`[v0] Failed to post ${contentType}/${contentId}:`, result.error)
    }
  } catch (error) {
    console.error(`[v0] Error posting ${contentType}/${contentId}:`, error)
  }
}
