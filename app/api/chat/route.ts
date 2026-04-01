import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const TELEGRAM_BOT_TOKEN = "6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"
const TELEGRAM_CHAT_IDS = [120705872] // Add more user IDs here if needed

async function sendToTelegram(sessionId: string, userName: string, message: string) {
  const text = `💬 Новое сообщение в чате\n\n👤 Сессия: ${sessionId}\n📝 Сообщение: ${message}\n\n💡 Чтобы ответить, отправьте:\n/reply ${sessionId} ваш_ответ`

  for (const chatId of TELEGRAM_CHAT_IDS) {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
        }),
      })
    } catch (error) {
      console.error(`[v0] Failed to send to Telegram chat ${chatId}:`, error)
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

    const { error: userMessageError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    })

    if (userMessageError) {
      console.error("[v0] Error saving user message:", userMessageError)
    }

    await sendToTelegram(sessionId, "Пользователь", message)

    // Get AI response from n8n webhook
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: "N8N_WEBHOOK_URL is not configured." }, { status: 500 })
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatInput: message, sessionId: sessionId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("n8n webhook error:", errorText)
      if (response.status === 404) {
        return NextResponse.json(
          { error: "The chatbot workflow appears to be inactive. Please activate the workflow in your n8n editor." },
          { status: 404 },
        )
      }
      return NextResponse.json({ error: "Failed to get response from chatbot." }, { status: response.status })
    }

    const data = await response.json()
    const botResponse = data?.output

    if (!botResponse) {
      console.error("n8n response did not contain an 'output' field.", data)
      return NextResponse.json(
        { error: "Received an unexpected response format from the chatbot. Check the n8n execution logs for details." },
        { status: 500 },
      )
    }

    const { error: botMessageError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "bot",
      content: botResponse,
    })

    if (botMessageError) {
      console.error("[v0] Error saving bot message:", botMessageError)
    }

    return NextResponse.json({ reply: botResponse })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 })
  }
}
