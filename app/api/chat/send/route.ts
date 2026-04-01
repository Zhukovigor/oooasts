import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const TELEGRAM_BOT_TOKEN = "6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"
const TELEGRAM_CHAT_IDS = [120705872]

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
      }
    } catch (error) {
      console.error(`Failed to send to Telegram chat ${chatId}:`, error)
    }
  }
}

async function getN8nResponse(message: string, sessionId: string): Promise<string> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  const fallbackResponse = "Спасибо за ваше сообщение! Менеджер свяжется с вами в ближайшее время."

  if (!webhookUrl) {
    return fallbackResponse
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatInput: message, sessionId: sessionId }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data?.output) {
        return data.output
      }
    }
  } catch (error) {
    // Silently handle all n8n errors - webhook might be in test mode or unavailable
  }

  return fallbackResponse
}

export async function POST(req: Request) {
  try {
    const { message, sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error: userMessageError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    })

    if (userMessageError) {
      console.error("Error saving user message:", userMessageError)
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
    }

    await sendToTelegram(sessionId, message)

    const botResponse = await getN8nResponse(message, sessionId)

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
