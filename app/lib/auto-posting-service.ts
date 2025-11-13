// app/api/cron/auto-post-content/route.ts
import { scanAndPostNewContent } from "../../../lib/auto-posting-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Проверяем cron secret если доступен
  const authHeader = request.headers.get("Authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log("[v0] Неавторизованный запрос к cron")
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 })
  }

  console.log("[v0] Cron job запущен - проверка переменных окружения")
  console.log("[v0] NEXT_PUBLIC_SUPABASE_URL существует:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("[v0] SUPABASE_SERVICE_ROLE_KEY существует:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log("[v0] NEXT_PUBLIC_SITE_URL существует:", !!process.env.NEXT_PUBLIC_SITE_URL)

  try {
    // Добавим проверку что функция существует
    if (typeof scanAndPostNewContent !== 'function') {
      throw new Error("Функция scanAndPostNewContent не найдена")
    }

    console.log("[v0] Запуск scanAndPostNewContent...")
    const result = await scanAndPostNewContent()
    console.log("[v0] Результат cron job:", result)
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Ошибка cron job:", error)
    return NextResponse.json({ 
      success: false, 
      error: String(error),
      message: "Внутренняя ошибка сервера"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
