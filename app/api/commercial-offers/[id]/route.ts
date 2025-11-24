// app/api/commercial-offers/[id]/route.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Интерфейсы данных
interface CreateOfferData {
  title: string
  price: number
  priceWithVat?: number
  availability?: string
  paymentType?: string
  lease?: string
  vatIncluded?: boolean
  diagnosticsPassed?: boolean
  imageUrl?: string
  headerImageUrl?: string
  footer?: string
  footerAlignment?: string
  footerFontSize?: number
  footerFontFamily?: string
  specifications?: Record<string, string>
  equipment?: string
  description?: string
  postToTelegram?: boolean
  channelIds?: string[]
  isActive?: boolean
  isFeatured?: boolean
}

interface UpdateOfferData {
  title?: string
  price?: number
  priceWithVat?: number
  availability?: string
  paymentType?: string
  lease?: string
  vatIncluded?: boolean
  diagnosticsPassed?: boolean
  imageUrl?: string
  headerImageUrl?: string
  footer?: string
  footerAlignment?: string
  footerFontSize?: number
  footerFontFamily?: string
  specifications?: Record<string, string>
  equipment?: string
  description?: string
  isActive?: boolean
  isFeatured?: boolean
}

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

// Валидация данных
class OfferValidator {
  static validateCreateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || !data.title.trim()) {
      errors.push("Название техники обязательно для заполнения")
    } else if (data.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
      errors.push(`Название не может превышать ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} символов`)
    }

    if (data.price === undefined || data.price === null) {
      errors.push("Цена обязательна для заполнения")
    } else if (typeof data.price !== "number" || isNaN(data.price) || data.price < 0) {
      errors.push("Цена должна быть положительным числом")
    } else if (data.price > VALIDATION_LIMITS.PRICE_MAX) {
      errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
    }

    if (data.priceWithVat !== undefined && data.priceWithVat !== null) {
      if (typeof data.priceWithVat !== "number" || isNaN(data.priceWithVat) || data.priceWithVat < 0) {
        errors.push("Цена с НДС должна быть положительным числом")
      } else if (data.priceWithVat > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена с НДС не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
      }
    }

    if (data.imageUrl && !this.isValidImageUrl(data.imageUrl)) {
      errors.push("Некорректный URL изображения")
    }

    if (data.headerImageUrl && !this.isValidImageUrl(data.headerImageUrl)) {
      errors.push("Некорректный URL заголовочного изображения")
    }

    if (data.specifications && typeof data.specifications !== "object") {
      errors.push("Спецификации должны быть объектом")
    } else if (
      data.specifications &&
      Object.keys(data.specifications).length > VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS
    ) {
      errors.push(`Слишком много характеристик (максимум ${VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS})`)
    }

    if (data.channelIds) {
      if (!Array.isArray(data.channelIds)) {
        errors.push("ChannelIds должен быть массивом")
      } else if (data.channelIds.length > VALIDATION_LIMITS.CHANNEL_IDS_MAX) {
        errors.push(`Слишком много каналов (максимум ${VALIDATION_LIMITS.CHANNEL_IDS_MAX})`)
      } else if (data.channelIds.some((id: any) => typeof id !== "string" || !id.trim())) {
        errors.push("Все channelIds должны быть непустыми строками")
      }
    }

    const stringFields = ["availability", "paymentType", "lease", "equipment", "description", "footer"] as const
    stringFields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null) {
        if (typeof data[field] !== "string") {
          errors.push(`Поле ${field} должно быть строкой`)
        } else {
          const maxLength =
            field === "description"
              ? VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH
              : VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH

          if (data[field].length > maxLength) {
            errors.push(`Поле ${field} не может превышать ${maxLength} символов`)
          }
        }
      }
    })

    return { isValid: errors.length === 0, errors }
  }

  static validateUpdateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        errors.push("Название не может быть пустым")
      } else if (data.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
        errors.push(`Название не может превышать ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} символов`)
      }
    }

    if (data.price !== undefined && data.price !== null) {
      if (typeof data.price !== "number" || isNaN(data.price) || data.price < 0) {
        errors.push("Цена должна быть положительным числом")
      } else if (data.price > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
      }
    }

    if (data.priceWithVat !== undefined && data.priceWithVat !== null) {
      if (typeof data.priceWithVat !== "number" || isNaN(data.priceWithVat) || data.priceWithVat < 0) {
        errors.push("Цена с НДС должна быть положительным числом")
      } else if (data.priceWithVat > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена с НДС не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
      }
    }

    if (data.imageUrl && !this.isValidImageUrl(data.imageUrl)) {
      errors.push("Некорректный URL изображения")
    }

    if (data.headerImageUrl && !this.isValidImageUrl(data.headerImageUrl)) {
      errors.push("Некорректный URL заголовочного изображения")
    }

    if (data.specifications !== undefined) {
      if (data.specifications && typeof data.specifications !== "object") {
        errors.push("Спецификации должны быть объектом")
      } else if (
        data.specifications &&
        Object.keys(data.specifications).length > VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS
      ) {
        errors.push(`Слишком много характеристик (максимум ${VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS})`)
      }
    }

    const stringFields = ["availability", "paymentType", "lease", "equipment", "description", "footer"] as const
    stringFields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null) {
        if (typeof data[field] !== "string") {
          errors.push(`Поле ${field} должно быть строкой`)
        } else {
          const maxLength =
            field === "description"
              ? VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH
              : VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH

          if (data[field].length > maxLength) {
            errors.push(`Поле ${field} не может превышать ${maxLength} символов`)
          }
        }
      }
    })

    return { isValid: errors.length === 0, errors }
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

// Трансформатор данных
class DataTransformer {
  static transformOfferForInsert(data: CreateOfferData) {
    const now = new Date().toISOString()

    return {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      price: Math.round(data.price),
      price_with_vat: data.priceWithVat ? Math.round(data.priceWithVat) : null,
      availability: data.availability?.trim() || null,
      payment_type: data.paymentType?.trim() || null,
      vat_included: Boolean(data.vatIncluded),
      diagnostics_passed: Boolean(data.diagnosticsPassed),
      image_url: data.imageUrl?.trim() || null,
      header_image_url: data.headerImageUrl?.trim() || null,
      footer: data.footer?.trim() || null,
      footer_alignment: data.footerAlignment?.trim() || null,
      footer_font_size: data.footerFontSize || null,
      footer_font_family: data.footerFontFamily?.trim() || null,
      specifications: data.specifications || {},
      currency: "RUB",
      equipment: data.equipment?.trim() || null,
      lease: data.lease?.trim() || null,
      created_at: now,
      updated_at: now,
      is_active: data.isActive !== undefined ? Boolean(data.isActive) : true,
      is_featured: Boolean(data.isFeatured) || false,
      post_to_telegram: Boolean(data.postToTelegram),
      channel_ids:
        Array.isArray(data.channelIds) && data.channelIds.length > 0
          ? data.channelIds
              .filter((id: any) => typeof id === "string" && id.trim())
              .slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX)
          : [],
      telegram_posted: false,
      telegram_message_id: null,
    }
  }

  static transformOfferForUpdate(data: UpdateOfferData) {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.title !== undefined) updateData.title = data.title.trim()
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.price !== undefined) updateData.price = Math.round(data.price)
    if (data.priceWithVat !== undefined)
      updateData.price_with_vat = data.priceWithVat ? Math.round(data.priceWithVat) : null
    if (data.availability !== undefined) updateData.availability = data.availability?.trim() || null
    if (data.paymentType !== undefined) updateData.payment_type = data.paymentType?.trim() || null
    if (data.vatIncluded !== undefined) updateData.vat_included = Boolean(data.vatIncluded)
    if (data.diagnosticsPassed !== undefined) updateData.diagnostics_passed = Boolean(data.diagnosticsPassed)
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl?.trim() || null
    if (data.headerImageUrl !== undefined) updateData.header_image_url = data.headerImageUrl?.trim() || null
    if (data.footer !== undefined) updateData.footer = data.footer?.trim() || null
    if (data.footerAlignment !== undefined) updateData.footer_alignment = data.footerAlignment?.trim() || null
    if (data.footerFontSize !== undefined) updateData.footer_font_size = data.footerFontSize || null
    if (data.footerFontFamily !== undefined) updateData.footer_font_family = data.footerFontFamily?.trim() || null
    if (data.specifications !== undefined) updateData.specifications = data.specifications || {}
    if (data.equipment !== undefined) updateData.equipment = data.equipment?.trim() || null
    if (data.lease !== undefined) updateData.lease = data.lease?.trim() || null
    if (data.isActive !== undefined) updateData.is_active = Boolean(data.isActive)
    if (data.isFeatured !== undefined) updateData.is_featured = Boolean(data.isFeatured)

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
    const text = await request.text()
    if (!text.trim()) {
      return ErrorHandler.handleValidationError(["Тело запроса не может быть пустым"])
    }

    let body: CreateOfferData
    try {
      body = JSON.parse(text)
    } catch {
      return ErrorHandler.handleValidationError(["Неверный формат JSON"])
    }

    const validation = OfferValidator.validateCreateData(body)
    if (!validation.isValid) {
      return ErrorHandler.handleValidationError(validation.errors)
    }

    const supabase = SupabaseUtils.createClient()

    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .ilike("title", body.title.trim())
      .limit(1)

    if (checkError) throw checkError
    if (existing?.length > 0) {
      return NextResponse.json(
        {
          error: "Коммерческое предложение с таким названием уже существует",
          existingId: existing[0].id,
        },
        { status: 409 },
      )
    }

    const insertData = DataTransformer.transformOfferForInsert(body)

    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select(`
        id, title, description, price, price_with_vat, availability, 
        payment_type, conditions, header_image_url, footer, 
        footer_alignment, footer_font_size, footer_font_family,
        vat_included, diagnostics_passed, image_url, 
        specifications, currency, equipment, lease, created_at, 
        updated_at, is_active, is_featured, post_to_telegram, 
        channel_ids, telegram_posted
      `)
      .single()

    if (error) {
      return ErrorHandler.handleDatabaseError(error)
    }

    console.log(`✅ Создано коммерческое предложение: ${data.id} - ${data.title}`)

    if (body.postToTelegram && body.channelIds?.length) {
      setImmediate(() => {
        TelegramService.publishOffer(data.id, body.channelIds!, request.nextUrl.origin).catch((err) =>
          console.error("Фоновая ошибка Telegram:", err),
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
    return ErrorHandler.handleServerError(error)
  }
}

// GET: Получение списка предложений
export async function GET(request: NextRequest) {
  try {
    const supabase = SupabaseUtils.createClient()
    const url = new URL(request.url)

    const page = Math.max(
      1,
      Math.min(VALIDATION_LIMITS.PAGE_MAX, Number.parseInt(url.searchParams.get("page") || "1", 10)),
    )
    const limit = Math.max(
      1,
      Math.min(VALIDATION_LIMITS.LIMIT_MAX, Number.parseInt(url.searchParams.get("limit") || "10", 10)),
    )
    const offset = (page - 1) * limit

    let search = url.searchParams.get("search")?.trim() || null
    if (search && search.length > VALIDATION_LIMITS.SEARCH_MAX_LENGTH) {
      search = search.substring(0, VALIDATION_LIMITS.SEARCH_MAX_LENGTH)
    }

    const isActive = url.searchParams.get("is_active")
    const isFeatured = url.searchParams.get("is_featured")

    let query = supabase.from("commercial_offers").select(
      `
        id, title, description, price, price_with_vat, availability, 
        image_url, created_at, updated_at, telegram_posted, 
        is_active, is_featured, equipment, payment_type, lease,
        diagnostics_passed, vat_included, specifications,
        conditions, header_image_url, footer, footer_alignment, footer_font_size, footer_font_family
      `,
      { count: "exact" },
    )

    if (search) {
      query = query.or(`title.ilike.%${search}%,equipment.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true")
    }
    if (isFeatured !== null) {
      query = query.eq("is_featured", isFeatured === "true")
    }

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
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id || !OfferValidator.validateId(id)) {
      return ErrorHandler.handleValidationError(["Некорректный ID предложения"])
    }

    const text = await request.text()
    if (!text.trim()) {
      return ErrorHandler.handleValidationError(["Тело запроса не может быть пустым"])
    }

    let body: UpdateOfferData
    try {
      body = JSON.parse(text)
    } catch {
      return ErrorHandler.handleValidationError(["Неверный формат JSON"])
    }

    const validation = OfferValidator.validateUpdateData(body)
    if (!validation.isValid) {
      return ErrorHandler.handleValidationError(validation.errors)
    }

    const supabase = SupabaseUtils.createClient()

    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return ErrorHandler.handleNotFoundError("Коммерческое предложение не найдено")
    }

    const updateData = DataTransformer.transformOfferForUpdate(body)

    const { data, error } = await supabase
      .from("commercial_offers")
      .update(updateData)
      .eq("id", id)
      .select(`
        id, title, description, price, price_with_vat, availability, 
        payment_type, conditions, header_image_url, footer, 
        footer_alignment, footer_font_size, footer_font_family,
        vat_included, diagnostics_passed, image_url, 
        specifications, currency, equipment, lease, created_at, 
        updated_at, is_active, is_featured
      `)
      .single()

    if (error) {
      return ErrorHandler.handleDatabaseError(error)
    }

    console.log(`✅ Обновлено коммерческое предложение: ${data.id}`)

    return NextResponse.json({
      success: true,
      data,
      message: "Коммерческое предложение успешно обновлено",
    })
  } catch (error: any) {
    return ErrorHandler.handleServerError(error)
  }
}

// DELETE: Удаление коммерческого предложения
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id || !OfferValidator.validateId(id)) {
      return ErrorHandler.handleValidationError(["Некорректный ID предложения"])
    }

    const supabase = SupabaseUtils.createClient()

    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return ErrorHandler.handleNotFoundError("Коммерческое предложение не найдено")
    }

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
