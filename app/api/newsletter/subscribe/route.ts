import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Некорректный email адрес" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("email", email)
      .single()

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json({ error: "Этот email уже подписан на рассылку" }, { status: 400 })
      } else {
        // Reactivate subscription
        const { error } = await supabase
          .from("newsletter_subscribers")
          .update({ status: "active", subscribed_at: new Date().toISOString() })
          .eq("id", existing.id)

        if (error) throw error
        return NextResponse.json({ message: "Подписка успешно возобновлена" })
      }
    }

    // Create new subscriber
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      name: name || null,
      status: "active",
      source: "website",
    })

    if (error) throw error

    return NextResponse.json({ message: "Подписка успешно оформлена" })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json({ error: "Ошибка при оформлении подписки" }, { status: 500 })
  }
}
