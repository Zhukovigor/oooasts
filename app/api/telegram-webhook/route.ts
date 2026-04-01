import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const TELEGRAM_BOT_TOKEN = "6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Telegram webhook received:", JSON.stringify(body, null, 2))

    const message = body.message
    if (!message || !message.text) {
      return NextResponse.json({ ok: true })
    }

    const text = message.text.trim()
    const chatId = message.chat.id

    // Обработка команды /reply
    if (text.startsWith("/reply ")) {
      const parts = text.substring(7).trim().split(" ")
      if (parts.length < 2) {
        await sendTelegramMessage(chatId, "❌ Неверный формат. Используйте:\n/reply session_id ваш_ответ")
        return NextResponse.json({ ok: true })
      }

      const sessionId = parts[0]
      const adminReply = parts.slice(1).join(" ")

      // Сохраняем ответ админа в базу
      const supabase = await createClient()
      const { error } = await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "admin",
        content: adminReply,
        telegram_message_id: message.message_id,
      })

      if (error) {
        console.error("Error saving admin message:", error)
        await sendTelegramMessage(chatId, "❌ Ошибка сохранения сообщения")
        return NextResponse.json({ ok: true })
      }

      await sendTelegramMessage(chatId, `✅ Ответ отправлен пользователю (сессия: ${sessionId})`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ ok: true })
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    })
  } catch (error) {
    console.error("Failed to send Telegram message:", error)
  }
}
