import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import AdvertisementEditClient from "./edit-client"

export const metadata = {
  title: "Редактировать рекламу | Админ панель",
  description: "Редактирование рекламного объявления",
}

// Валидация ID
function isValidId(id: string): boolean {
  return /^[a-f0-9-]+$/i.test(id) && id.length > 0
}

// Безопасный парсинг JSON
function safeJsonParse<T>(value: any, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value ?? fallback
}

export default async function EditAdvertisementPage({
  params,
}: {
  params: { id: string }  // УБРАТЬ Promise<>
}) {
  const { id } = params  // УБРАТЬ await и resolvedParams

  console.log('Edit page - ID received:', id)

  if (!id || !isValidId(id)) {
    console.error("[EditAdvertisementPage] Invalid ID provided:", id)
    return notFound()
  }

  try {
    const supabase = createAdminClient()

    console.log('Fetching advertisement with ID:', id)

    const { data: advertisement, error } = await supabase
      .from("advertisements")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !advertisement) {
      console.error("[EditAdvertisementPage] Database error or not found:", {
        error,
        id,
        found: !!advertisement
      })
      return notFound()
    }

    console.log('Advertisement found:', advertisement.title)

    // Безопасный парсинг JSON полей с учетом структуры из advertisement-modal
    const parsedAdvertisement = {
      ...advertisement,
      text_overlay: safeJsonParse(advertisement.text_overlay, {}),
      collage_config: safeJsonParse(advertisement.collage_config, {}),
      // Убедимся, что числовые поля имеют значения по умолчанию
      display_duration_seconds: advertisement.display_duration_seconds || 30,
      close_delay_seconds: advertisement.close_delay_seconds || 5,
      max_shows_per_day: advertisement.max_shows_per_day || 10,
      background_opacity: advertisement.background_opacity || 0.8,
      shows_today: advertisement.shows_today || 0,
      total_views: advertisement.total_views || 0,
      total_clicks: advertisement.total_clicks || 0,
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок страницы */}
          <div className="mb-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Редактировать рекламу
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Обновите параметры рекламного объявления
                </p>
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    parsedAdvertisement.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {parsedAdvertisement.is_active ? 'Активна' : 'Неактивна'}
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
            <AdvertisementEditClient advertisement={parsedAdvertisement} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("[EditAdvertisementPage] Unexpected error:", {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      id
    })
    return notFound()
  }
}
