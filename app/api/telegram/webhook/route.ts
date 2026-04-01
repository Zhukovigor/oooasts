import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const TELEGRAM_BOT_TOKEN = "6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("🔵 Telegram webhook received:", JSON.stringify(body, null, 2))

    const message = body.message
    if (!message || !message.text) {
      return NextResponse.json({ ok: true })
    }

    const text = message.text.trim()
    const chatId = message.chat.id

    console.log("🔵 Processing message:", text)

    // Обработка команды /reply
    if (text.startsWith("/reply ")) {
      const parts = text.substring(7).trim().split(" ")
      if (parts.length < 2) {
        await sendTelegramMessage(chatId, "❌ Неверный формат. Используйте:\n/reply session_id ваш_ответ")
        return NextResponse.json({ ok: true })
      }

      const sessionId = parts[0]
      const adminReply = parts.slice(1).join(" ")

      console.log("🔵 Saving admin reply:", { sessionId, adminReply })

      // Сохраняем ответ админа в базу с явным указанием времени
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          role: "admin",
          content: adminReply,
          telegram_message_id: message.message_id,
          created_at: new Date().toISOString() // Явно указываем время создания
        })
        .select()

      if (error) {
        console.error("❌ Error saving admin message:", error)
        await sendTelegramMessage(chatId, "❌ Ошибка сохранения сообщения: " + error.message)
        return NextResponse.json({ ok: true })
      }

      console.log("✅ Admin message saved:", data)

      await sendTelegramMessage(chatId, `✅ Ответ отправлен пользователю (сессия: ${sessionId})`)
      
      // Логируем для отладки
      console.log("🟡 Checking if message is in database...")
      const { data: checkData } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(5)
      
      console.log("🟡 Latest messages in session:", checkData)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("❌ Telegram webhook error:", error)
    return NextResponse.json({ ok: true })
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    })
    
    const data = await response.json()
    if (!data.ok) {
      console.error("❌ Failed to send Telegram message:", data)
    }
  } catch (error) {
    console.error("❌ Failed to send Telegram message:", error)
  }
}
