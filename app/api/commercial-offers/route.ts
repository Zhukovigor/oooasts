// app/api/commercial-offers/route.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Константы для валидации
const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  PRICE_MAX: 1000000000,
  SPECIFICATIONS_MAX_KEYS: 50,
  CHANNEL_IDS_MAX: 10,
  SEARCH_MAX_LENGTH: 100,
  PAGE_MAX: 1000,
  LIMIT_MAX: 100,
  STRING_FIELD_MAX_LENGTH: 500,
  IMAGE_URL_MAX_LENGTH: 2000,
} as const

// Интерфейсы данных - ИСПРАВЛЕНЫ для соответствия фронтенду
interface CommercialOfferData {
  title: string
  price: number | string
  price_with_vat?: number | string | null
  availability?: string | null
  payment_type?: string | null
  lease?: string | null
  conditions?: string | null
  header_image_url?: string | null
  footer_text?: string | null
  footer_alignment?: string
  footer_font_size?: number
  vat_included?: boolean
  diagnostics_passed?: boolean
  image_url?: string | null
  specifications?: Record<string, string> | string | null
  equipment?: string | null
  description?: string | null
  post_to_telegram?: boolean
  channel_ids?: string[]
  is_active?: boolean
  is_featured?: boolean
  offer_title?: string | null
  title_font_size?: number
  equipment_font_size?: number
  price_block_offset?: number
  photo_scale?: string | number
  footer_padding?: number
  model?: string | null
  currency?: string
}

interface CommercialOfferUpdateData {
  title?: string
  price?: number | string
  price_with_vat?: number | string | null
  availability?: string | null
  payment_type?: string | null
  lease?: string | null
  conditions?: string | null
  header_image_url?: string | null
  footer_text?: string | null
  footer_alignment?: string
  footer_font_size?: number
  vat_included?: boolean
  diagnostics_passed?: boolean
  image_url?: string | null
  specifications?: Record<string, string> | string | null
  equipment?: string | null
  description?: string | null
  is_active?: boolean
  is_featured?: boolean
  offer_title?: string | null
  title_font_size?: number
  equipment_font_size?: number
  price_block_offset?: number
  photo_scale?: string | number
  footer_padding?: number
  model?: string | null
  currency?: string
}

// Улучшенная валидация
class OfferValidator {
  static validateCreateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Валидация названия
    if (!data.title || !data.title.trim()) {
      errors.push("Название техники обязательно для заполнения")
    } else if (data.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
      errors.push(`Название не может превышать ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} символов`)
    }

    // Валидация цены
    if (data.price === undefined || data.price === null) {
      errors.push("Цена обязательна для заполнения")
    } else {
      const price = this.parsePrice(data.price)
      if (price <= 0) {
        errors.push("Цена должна быть положительным числом")
      } else if (price > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
      }
    }

    // Валидация URL изображения
    if (data.image_url && !this.isValidImageUrl(data.image_url)) {
      errors.push("Некорректный URL изображения")
    }

    if (data.header_image_url && !this.isValidImageUrl(data.header_image_url)) {
      errors.push("Некорректный URL заголовочного изображения")
    }

    return { isValid: errors.length === 0, errors }
  }

  static validateUpdateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (Object.keys(data).length === 0) {
      errors.push("Нет данных для обновления")
      return { isValid: false, errors }
    }

    // Для обновления title не обязателен, но если передан - валидируем
    if (data.title !== undefined) {
      if (!data.title.trim()) {
        errors.push("Название не может быть пустым")
      } else if (data.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
        errors.push(`Название не может превышать ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} символов`)
      }
    }

    // Валидация цены если передана
    if (data.price !== undefined && data.price !== null) {
      const price = this.parsePrice(data.price)
      if (price <= 0) {
        errors.push("Цена должна быть положительным числом")
      } else if (price > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
      }
    }

    // Валидация URL изображения если передан
    if (data.image_url && !this.isValidImageUrl(data.image_url)) {
      errors.push("Некорректный URL изображения")
    }

    if (data.header_image_url && !this.isValidImageUrl(data.header_image_url)) {
      errors.push("Некорректный URL заголовочного изображения")
    }

    return { isValid: errors.length === 0, errors }
  }

  static parsePrice(price: any): number {
    if (typeof price === 'number') return Math.round(price)
    if (typeof price === 'string') {
      // Удаляем пробелы и преобразуем в число
      const cleanPrice = price.replace(/\s/g, '')
      return Math.round(parseFloat(cleanPrice) || 0)
    }
    return 0
  }

  static isValidImageUrl(url: string): boolean {
    if (!url || url.length > VALIDATION_LIMITS.IMAGE_URL_MAX_LENGTH) return false
    try {
      const urlObj = new URL(url)
      return ["http:", "https:"].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  static validateId(id: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 100
  }
}

// Утилиты для работы с Supabase
class SupabaseUtils {
  static createClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Отсутствуют переменные окружения Supabase")
    }

    const cookieStore = cookies()

    return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Игнорируем запись кук
        },
      },
    })
  }
}

// Сервис для работы с Telegram
class TelegramService {
  static async publishOffer(offerId: string, channelIds: string[], origin: string) {
    try {
      const response = await fetch(`${origin}/api/telegram/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          channelIds: channelIds.slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX),
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Telegram API error (${response.status}): ${text}`)
      }

      const result = await response.json()
      console.log(`✅ Успешная публикация в Telegram для предложения ${offerId}`)
      return result
    } catch (error) {
      console.error("❌ Ошибка при публикации в Telegram:", error)
    }
  }
}

// Трансформатор данных - ИСПРАВЛЕН для работы с фронтендом
class DataTransformer {
  static sanitizeInput(input: string): string {
    if (!input) return ""
    return input.trim()
  }

  static sanitizeSpecifications(specs: any): Record<string, string> {
    if (!specs) return {}
    
    // Если спецификации приходят как строка JSON, парсим их
    if (typeof specs === 'string') {
      try {
        specs = JSON.parse(specs)
      } catch {
        return {}
      }
    }
    
    if (typeof specs !== 'object' || Array.isArray(specs)) {
      return {}
    }
    
    const sanitized: Record<string, string> = {}
    for (const [key, value] of Object.entries(specs)) {
      if (typeof value === 'string') {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value)
      }
    }
    return sanitized
  }

  static transformOfferForInsert(data: CommercialOfferData) {
    const now = new Date().toISOString()

    return {
      title: this.sanitizeInput(data.title),
      description: data.description ? this.sanitizeInput(data.description) : null,
      equipment: data.equipment ? this.sanitizeInput(data.equipment) : null,
      model: data.model ? this.sanitizeInput(data.model) : null,
      price: OfferValidator.parsePrice(data.price),
      price_with_vat: data.price_with_vat ? OfferValidator.parsePrice(data.price_with_vat) : null,
      currency: data.currency || "RUB",
      availability: data.availability ? this.sanitizeInput(data.availability) : "В наличии",
      payment_type: data.payment_type ? this.sanitizeInput(data.payment_type) : null,
      lease: data.lease ? this.sanitizeInput(data.lease) : null,
      vat_included: Boolean(data.vat_included),
      diagnostics_passed: Boolean(data.diagnostics_passed),
      image_url: data.image_url ? this.sanitizeInput(data.image_url) : null,
      header_image_url: data.header_image_url ? this.sanitizeInput(data.header_image_url) : null,
      specifications: this.sanitizeSpecifications(data.specifications),
      post_to_telegram: Boolean(data.post_to_telegram),
      channel_ids: Array.isArray(data.channel_ids) ? data.channel_ids : [],
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      is_featured: Boolean(data.is_featured) || false,
      footer_text: data.footer_text ? this.sanitizeInput(data.footer_text) : "",
      footer_font_size: data.footer_font_size || 12,
      footer_alignment: data.footer_alignment || "center",
      footer_padding: data.footer_padding || 15,
      title_font_size: data.title_font_size || 28,
      equipment_font_size: data.equipment_font_size || 16,
      price_block_offset: data.price_block_offset || 0,
      photo_scale: data.photo_scale?.toString() || "1",
      offer_title: data.offer_title ? this.sanitizeInput(data.offer_title) : "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ",
      created_at: now,
      updated_at: now,
      telegram_posted: false,
      telegram_message_id: null,
    }
  }

  static transformOfferForUpdate(data: CommercialOfferUpdateData) {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Динамически добавляем только переданные поля
    if (data.title !== undefined) updateData.title = this.sanitizeInput(data.title)
    if (data.description !== undefined) updateData.description = data.description ? this.sanitizeInput(data.description) : null
    if (data.equipment !== undefined) updateData.equipment = data.equipment ? this.sanitizeInput(data.equipment) : null
    if (data.model !== undefined) updateData.model = data.model ? this.sanitizeInput(data.model) : null
    if (data.price !== undefined) updateData.price = OfferValidator.parsePrice(data.price)
    if (data.price_with_vat !== undefined) updateData.price_with_vat = data.price_with_vat ? OfferValidator.parsePrice(data.price_with_vat) : null
    if (data.currency !== undefined) updateData.currency = data.currency || "RUB"
    if (data.availability !== undefined) updateData.availability = data.availability ? this.sanitizeInput(data.availability) : "В наличии"
    if (data.payment_type !== undefined) updateData.payment_type = data.payment_type ? this.sanitizeInput(data.payment_type) : null
    if (data.lease !== undefined) updateData.lease = data.lease ? this.sanitizeInput(data.lease) : null
    if (data.vat_included !== undefined) updateData.vat_included = Boolean(data.vat_included)
    if (data.diagnostics_passed !== undefined) updateData.diagnostics_passed = Boolean(data.diagnostics_passed)
    if (data.image_url !== undefined) updateData.image_url = data.image_url ? this.sanitizeInput(data.image_url) : null
    if (data.header_image_url !== undefined) updateData.header_image_url = data.header_image_url ? this.sanitizeInput(data.header_image_url) : null
    if (data.specifications !== undefined) updateData.specifications = this.sanitizeSpecifications(data.specifications)
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active)
    if (data.is_featured !== undefined) updateData.is_featured = Boolean(data.is_featured)
    if (data.footer_text !== undefined) updateData.footer_text = data.footer_text ? this.sanitizeInput(data.footer_text) : ""
    if (data.footer_font_size !== undefined) updateData.footer_font_size = data.footer_font_size || 12
    if (data.footer_alignment !== undefined) updateData.footer_alignment = data.footer_alignment || "center"
    if (data.footer_padding !== undefined) updateData.footer_padding = data.footer_padding || 15
    if (data.title_font_size !== undefined) updateData.title_font_size = data.title_font_size || 28
    if (data.equipment_font_size !== undefined) updateData.equipment_font_size = data.equipment_font_size || 16
    if (data.price_block_offset !== undefined) updateData.price_block_offset = data.price_block_offset || 0
    if (data.photo_scale !== undefined) updateData.photo_scale = data.photo_scale?.toString() || "1"
    if (data.offer_title !== undefined) updateData.offer_title = data.offer_title ? this.sanitizeInput(data.offer_title) : "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ"

    return updateData
  }
}

// Обработчик ошибок
class ErrorHandler {
  static handleDatabaseError(error: any): NextResponse {
    console.error("Ошибка базы данных:", error)

    if (error.code === "23505") {
      return NextResponse.json({ error: "Предложение уже существует" }, { status: 409 })
    }

    if (error.code === "42501") {
      return NextResponse.json({ error: "Ошибка доступа к базе данных" }, { status: 403 })
    }

    return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 })
  }

  static handleValidationError(errors: string[]): NextResponse {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 })
  }

  static handleNotFoundError(message = "Ресурс не найден"): NextResponse {
    return NextResponse.json({ error: message }, { status: 404 })
  }

  static handleServerError(error: any): NextResponse {
    console.error("Критическая ошибка сервера:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

// POST: Создание коммерческого предложения
export async function POST(request: NextRequest) {
  try {
    // Парсинг и валидация тела запроса
    const text = await request.text()
    if (!text.trim()) {
      return ErrorHandler.handleValidationError(["Тело запроса не может быть пустым"])
    }

    let body: CommercialOfferData
    try {
      body = JSON.parse(text)
    } catch (error) {
      console.error("[API] JSON parse error:", error)
      return ErrorHandler.handleValidationError(["Неверный формат JSON"])
    }

    console.log("[API] Received POST data:", body)

    // Валидация данных
    const validation = OfferValidator.validateCreateData(body)
    if (!validation.isValid) {
      console.error("[API] Validation errors:", validation.errors)
      return ErrorHandler.handleValidationError(validation.errors)
    }

    // Создание клиента Supabase
    const supabase = SupabaseUtils.createClient()

    // Проверка дубликатов
    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .ilike("title", body.title.trim())
      .limit(1)

    if (checkError) {
      console.error("[API] Check error:", checkError)
      throw checkError
    }

    if (existing?.length > 0) {
      return NextResponse.json(
        {
          error: "Коммерческое предложение с таким названием уже существует",
          existingId: existing[0].id,
        },
        { status: 409 },
      )
    }

    // Подготовка и вставка данных
    const insertData = DataTransformer.transformOfferForInsert(body)
    console.log("[API] Insert data:", insertData)

    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select('*') // Выбираем ВСЕ поля
      .single()

    if (error) {
      console.error("[API] Database error:", error)
      return ErrorHandler.handleDatabaseError(error)
    }

    console.log("[API] Created offer:", data.id)

    // Асинхронная публикация в Telegram (не блокируем ответ)
    if (body.post_to_telegram && body.channel_ids?.length) {
      setImmediate(() => {
        TelegramService.publishOffer(data.id, body.channel_ids!, request.nextUrl.origin).catch((err) =>
          console.error("[API] Telegram error:", err),
        )
      })
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: "Коммерческое предложение успешно создано",
        id: data.id,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("[API] Server error:", error)
    return ErrorHandler.handleServerError(error)
  }
}

// GET: Получение списка предложений
export async function GET(request: NextRequest) {
  try {
    const supabase = SupabaseUtils.createClient()
    const url = new URL(request.url)

    // Параметры пагинации
    const page = Math.max(
      1,
      Math.min(VALIDATION_LIMITS.PAGE_MAX, Number.parseInt(url.searchParams.get("page") || "1", 10)),
    )
    const limit = Math.max(
      1,
      Math.min(VALIDATION_LIMITS.LIMIT_MAX, Number.parseInt(url.searchParams.get("limit") || "10", 10)),
    )
    const offset = (page - 1) * limit

    // Параметры фильтрации
    let search = url.searchParams.get("search")?.trim() || null
    if (search && search.length > VALIDATION_LIMITS.SEARCH_MAX_LENGTH) {
      search = search.substring(0, VALIDATION_LIMITS.SEARCH_MAX_LENGTH)
    }

    const isActive = url.searchParams.get("is_active")
    const isFeatured = url.searchParams.get("is_featured")

    // Построение запроса - выбираем ВСЕ поля
    let query = supabase.from("commercial_offers").select('*', { count: "exact" })

    // Применение фильтров
    if (search) {
      query = query.or(`title.ilike.%${search}%,equipment.ilike.%${search}%,description.ilike.%${search}%,model.ilike.%${search}%`)
    }
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true")
    }
    if (isFeatured !== null) {
      query = query.eq("is_featured", isFeatured === "true")
    }

    // Выполнение запроса
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        search,
        isActive: isActive || null,
        isFeatured: isFeatured || null,
      },
    })
  } catch (error) {
    console.error("Ошибка получения списка предложений:", error)
    return NextResponse.json({ error: "Ошибка сервера при получении данных" }, { status: 500 })
  }
}

// PATCH: Обновление коммерческого предложения
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id || !OfferValidator.validateId(id)) {
      return ErrorHandler.handleValidationError(["Некорректный ID предложения"])
    }

    const text = await request.text()
    if (!text.trim()) {
      return ErrorHandler.handleValidationError(["Тело запроса не может быть пустым"])
    }

    let body: CommercialOfferUpdateData
    try {
      body = JSON.parse(text)
    } catch {
      return ErrorHandler.handleValidationError(["Неверный формат JSON"])
    }

    console.log("[API] PATCH data received:", { id, body })

    // Валидация данных для обновления
    const validation = OfferValidator.validateUpdateData(body)
    if (!validation.isValid) {
      console.error("[API] Validation errors:", validation.errors)
      return ErrorHandler.handleValidationError(validation.errors)
    }

    const supabase = SupabaseUtils.createClient()

    // Проверка существования предложения
    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return ErrorHandler.handleNotFoundError("Коммерческое предложение не найдено")
    }

    // Подготовка данных для обновления
    const updateData = DataTransformer.transformOfferForUpdate(body)
    console.log("[API] Update data:", updateData)

    const { data, error } = await supabase
      .from("commercial_offers")
      .update(updateData)
      .eq("id", id)
      .select('*') // Выбираем ВСЕ поля
      .single()

    if (error) {
      console.error("[API] Database update error:", error)
      return ErrorHandler.handleDatabaseError(error)
    }

    console.log(`✅ Обновлено коммерческое предложение: ${data.id}`)

    return NextResponse.json({
      success: true,
      data,
      message: "Коммерческое предложение успешно обновлено",
    })
  } catch (error: any) {
    console.error("[API] Server error:", error)
    return ErrorHandler.handleServerError(error)
  }
}

// DELETE: Удаление коммерческого предложения
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id || !OfferValidator.validateId(id)) {
      return ErrorHandler.handleValidationError(["Некорректный ID предложения"])
    }

    const supabase = SupabaseUtils.createClient()

    // Проверка существования предложения
    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return ErrorHandler.handleNotFoundError("Коммерческое предложение не найдено")
    }

    // Удаление предложения
    const { error } = await supabase.from("commercial_offers").delete().eq("id", id)

    if (error) {
      return ErrorHandler.handleDatabaseError(error)
    }

    console.log(`✅ Удалено коммерческое предложение: ${id}`)

    return NextResponse.json({
      success: true,
      message: "Коммерческое предложение успешно удалено",
    })
  } catch (error: any) {
    return ErrorHandler.handleServerError(error)
  }
}
