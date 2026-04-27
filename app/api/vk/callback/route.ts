import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: "Нет code" }, { status: 400 })
  }

  const params = new URLSearchParams({
    client_id: "54519669",
    client_secret: process.env.VK_CLIENT_SECRET || "",
    redirect_uri: "https://asts.vercel.app/api/vk/callback",
    code,
  })

  const response = await fetch(`https://oauth.vk.com/access_token?${params}`)
  const data = await response.json()

  return NextResponse.json(data)
}