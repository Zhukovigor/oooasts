import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Редактировать рекламу | Админ панель",
  description: "Редактирование рекламного объявления",
}

// Валидация UUID
function isValidUUID(id: string): boolean {
  if (!id) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Безопасный парсинг JSON
function safeJsonParse<T>(value: any, fallback: T): T {
  if (typeof value === "string" && value.trim() !== "") {
    try {
      return JSON.parse(value) as T
    } catch {
      console.error("[v0] JSON parse error:", value)
      return fallback
    }
  }
  return value ?? fallback
}

// Fallback компонент если AdvertisementEditClient не загрузится
function AdvertisementEditClientFallback({ advertisement }: { advertisement: any }) {
  return (
    <div className="p-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-800">Компонент редактирования загружается...</h3>
        <p className="text-yellow-700 mt-2">ID: {advertisement.id}</p>
        <p className="text-yellow-700">Название: {advertisement.title}</p>
      </div>
    </div>
  )
}

export default async function EditAdvertisementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  console.log("[v0] Edit page loaded with id:", id)

  if (!id || !isValidUUID(id)) {
    console.error("[v0] Invalid UUID:", id)
    return notFound()
  }

  try {
    const supabase = createAdminClient()

    const { data: advertisement, error } = await supabase.from("advertisements").select("*").eq("id", id).single()

    console.log("[v0] Database query result:", { data: !!advertisement, error })

    if (error) {
      console.error("[v0] Database error:", error)
      return notFound()
    }

    if (!advertisement) {
      console.error("[v0] Advertisement not found")
      return notFound()
    }

    const parsedAdvertisement = {
      ...advertisement,
      text_overlay: safeJsonParse(advertisement.text_overlay, {
        enabled: false,
        text: "",
        x: 50,
        y: 50,
        fontSize: 24,
        fontFamily: "Arial",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        color: "#ffffff",
        opacity: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        backgroundOpacity: 0.7,
        padding: 10,
        borderRadius: 8,
        maxWidth: 80,
        rotation: 0,
      }),
      collage_config: safeJsonParse(advertisement.collage_config, {
        mode: "2x1",
        orientation: "horizontal",
        skewAngle: 15,
        images: [],
        spacing: 8,
        borderRadius: 12,
        backgroundColor: "#ffffff",
      }),
      // Убедимся, что числовые поля имеют значения по умолчанию
      display_duration_seconds: advertisement.display_duration_seconds || 30,
      close_delay_seconds: advertisement.close_delay_seconds || 5,
      max_shows_per_day: advertisement.max_shows_per_day || 10,
      background_opacity: advertisement.background_opacity || 0.8,
      shows_today: advertisement.shows_today || 0,
      total_views: advertisement.total_views || 0,
      total_clicks: advertisement.total_clicks || 0,
    }

    // Динамически загружаем клиентский компонент с обработкой ошибок
    let EditClientComponent
    try {
      EditClientComponent = (await import("./edit-client")).default
    } catch (error) {
      console.error("Failed to load edit-client component:", error)
      EditClientComponent = AdvertisementEditClientFallback
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок страницы */}
          <div className="mb-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Редактировать рекламу</h1>
                <p className="text-gray-600 text-sm sm:text-base">Обновите параметры рекламного объявления</p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <span className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  ID: {id}
                </span>
              </div>
            </div>
          </div>

          {/* Информация о рекламе */}
          <div className="bg-white shadow-sm rounded-lg mb-6 p-4 border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">Название:</span>
                <p className="text-gray-900 mt-1">{parsedAdvertisement.title}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Статус:</span>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      parsedAdvertisement.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {parsedAdvertisement.is_active ? "Активна" : "Неактивна"}
                  </span>
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Статистика:</span>
                <p className="text-gray-900 mt-1">
                  Просмотры: {parsedAdvertisement.total_views}, Клики: {parsedAdvertisement.total_clicks}
                </p>
              </div>
            </div>
          </div>

          {/* Основной контент */}
          <div className="bg-white shadow rounded-lg">
            <EditClientComponent advertisement={parsedAdvertisement} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return notFound()
  }
}
