import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = "6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"

export async function GET() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Failed to get updates" }, { status: 500 })
  }
}
