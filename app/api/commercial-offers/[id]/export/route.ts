import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const offerId = params.id
    if (!offerId) {
      return NextResponse.json({ error: "ID предложения обязателен" }, { status: 400 })
    }

    const cookieStore = cookies()

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[v0] Missing Supabase env vars")
      return NextResponse.json({ error: "Конфигурация сервера" }, { status: 500 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const { data, error } = await supabase.from("commercial_offers").select("*").eq("id", offerId).single()

    if (error) {
      console.error("[v0] Export Supabase error:", error)
      return NextResponse.json({ error: "Коммерческое предложение не найдено" }, { status: 404 })
    }

    if (!data) {
      return NextResponse.json({ error: "Коммерческое предложение не найдено" }, { status: 404 })
    }

    const json = JSON.stringify(data, null, 2)
    const filename = `${data.title || "offer"}_${new Date().toISOString().split("T")[0]}.json`

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("[v0] Export error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера", details: error.message }, { status: 500 })
  }
}
