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
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const { data, error } = await supabase.from("commercial_offers").select("*").eq("id", offerId).single()

    if (error || !data) {
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
    console.error("Export error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
