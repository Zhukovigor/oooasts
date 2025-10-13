import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("sessionId")
    const since = searchParams.get("since")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (since) {
      query = query.gt("created_at", since)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages: data || [] })
  } catch (error) {
    console.error("[v0] Chat messages API error:", error)
    return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 })
  }
}
