import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const TELEGRAM_BOT_TOKEN = "6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"
const TELEGRAM_CHAT_IDS = [120705872] // Ваш chat ID

async function sendToTelegram(sessionId: string, message: string) {
  const text = `💬 Новое сообщение в чате\n\n👤 Сессия: ${sessionId}\n📝 Сообщение: ${message}\n\n💡 Чтобы ответить, отправьте:\n/reply ${sessionId} ваш_ответ`

  for (const chatId of TELEGRAM_CHAT_IDS) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
        }),
      })

      const data = await response.json()
      if (!data.ok) {
        console.error(`Telegram error for chat ${chatId}:`, data)
      } else {
        console.log(`Message sent to Telegram chat ${chatId}`)
      }
    } catch (error) {
      console.error(`Failed to send to Telegram chat ${chatId}:`, error)
    }
  }
}

export async function POST(req: Request) {
  try {
    const { message, sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Сохраняем сообщение пользователя
    const { error: userMessageError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    })

    if (userMessageError) {
      console.error("Error saving user message:", userMessageError)
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
    }

    // Отправляем уведомление в Telegram
    await sendToTelegram(sessionId, message)

    // Получаем ответ от AI (n8n)
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    
    let botResponse = "Спасибо за ваше сообщение! Менеджер свяжется с вами в ближайшее время."

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chatInput: message, sessionId: sessionId }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data?.output) {
            botResponse = data.output
          }
        }
      } catch (n8nError) {
        console.error("n8n webhook error:", n8nError)
        // Продолжаем со стандартным ответом
      }
    }

    // Сохраняем ответ бота
    const { error: botMessageError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "bot",
      content: botResponse,
    })

    if (botMessageError) {
      console.error("Error saving bot message:", botMessageError)
    }

    return NextResponse.json({ reply: botResponse })

  } catch (error) {
    console.error("Chat send API error:", error)
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 })
  }
}
