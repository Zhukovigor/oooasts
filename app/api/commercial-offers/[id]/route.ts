// app/api/commercial-offers/[id]/route.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Конфигурация
const CONFIG = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  },
} as const

// Константы для валидации
const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  PRICE_MAX: 100000000000,
  SPECIFICATIONS_MAX_KEYS: 50,
  CHANNEL_IDS_MAX: 10,
  STRING_FIELD_MAX_LENGTH: 500,
  IMAGE_URL_MAX_LENGTH: 2000,
  SPECIFICATION_KEY_MAX_LENGTH: 100,
  SPECIFICATION_VALUE_MAX_LENGTH: 500,
} as const

// Интерфейсы данных - ОБНОВЛЕНЫ для соответствия фронтенду
interface CommercialOfferUpdateData {
  title?: string
  description?: string | null
  equipment?: string | null
  model?: string | null
  price?: number | string
  price_with_vat?: number | string | null
  currency?: string
  availability?: string | null
  payment_type?: string | null
  lease?: string | null
  vat_included?: boolean
  diagnostics_passed?: boolean
  image_url?: string | null
  specifications?: Record<string, string> | string | null
  post_to_telegram?: boolean
  channel_ids?: string[]
  is_active?: boolean
  is_featured?: boolean
  footer_text?: string | null
  footer_font_size?: number
  footer_alignment?: string
  footer_padding?: number
  header_image_url?: string | null
  title_font_size?: number
  equipment_font_size?: number
  price_block_offset?: number
  photo_scale?: string | number
  offer_title?: string | null
}

interface SupabaseError {
  code: string
  message: string
  details?: string
  hint?: string
}

// Логирование
class Logger {
  static info(message: string, metadata?: Record<string, any>) {
    console.log(
      JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message,
        ...metadata,
      }),
    )
  }

  static error(message: string, error?: any, metadata?: Record<string, any>) {
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        error: error?.message,
        stack: error?.stack,
        ...metadata,
      }),
    )
  }

  static warn(message: string, metadata?: Record<string, any>) {
    console.warn(
      JSON.stringify({
        level: "warn",
        timestamp: new Date().toISOString(),
        message,
        ...metadata,
      }),
    )
  }
}

// Утилиты безопасности
class SecurityUtils {
  static sanitizeInput(input: string): string {
    if (!input) return ""
    return input
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .trim()
  }

  static sanitizeSpecifications(specs: any): Record<string, string> {
    if (!specs) return {}
    
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

  static parsePrice(price: any): number {
    if (typeof price === 'number') return Math.round(price)
    if (typeof price === 'string') {
      const cleanPrice = price.replace(/[\s,]/g, '')
      const parsed = parseFloat(cleanPrice)
      return isNaN(parsed) ? 0 : Math.round(parsed)
    }
    return 0
  }

  static getClientIdentifier(request: NextRequest): string {
    return request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  }
}

// Валидация данных
class OfferValidator {
  static validateUpdateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (Object.keys(data).length === 0) {
      errors.push("Нет данных для обновления")
      return { isValid: false, errors }
    }

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        errors.push("Название не может быть пустым")
      } else if (data.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
        errors.push(`Название не может превышать ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} символов`)
      }
    }

    if (data.price !== undefined && data.price !== null) {
      const price = SecurityUtils.parsePrice(data.price)
      if (price <= 0) {
        errors.push("Цена должна быть положительным числом")
      } else if (price > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
      }
    }

    if (data.image_url && !this.isValidImageUrl(data.image_url)) {
      errors.push("Некорректный URL изображения")
    }

    if (data.header_image_url && !this.isValidImageUrl(data.header_image_url)) {
      errors.push("Некорректный URL заголовочного изображения")
    }

    if (data.specifications !== undefined) {
      const specsValidation = this.validateSpecifications(data.specifications)
      if (!specsValidation.isValid) {
        errors.push(...specsValidation.errors)
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  static validateSpecifications(specs: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (specs === undefined || specs === null) {
      return { isValid: true, errors }
    }

    if (typeof specs === 'string') {
      try {
        specs = JSON.parse(specs)
      } catch {
        errors.push("Спецификации должны быть валидным JSON объектом")
        return { isValid: false, errors }
      }
    }

    if (typeof specs !== 'object' || Array.isArray(specs)) {
      errors.push("Спецификации должны быть объектом")
      return { isValid: false, errors }
    }

    const entries = Object.entries(specs)
    if (entries.length > VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS) {
      errors.push(`Слишком много характеристик (максимум ${VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS})`)
    }

    for (const [key, value] of entries) {
      if (typeof key !== "string" || key.length > VALIDATION_LIMITS.SPECIFICATION_KEY_MAX_LENGTH) {
        errors.push(`Ключ спецификации слишком длинный: ${key.substring(0, 50)}`)
      }

      if (typeof value !== "string" || value.length > VALIDATION_LIMITS.SPECIFICATION_VALUE_MAX_LENGTH) {
        errors.push(`Значение спецификации слишком длинное для ключа: ${key.substring(0, 50)}`)
      }
    }

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
    if (!CONFIG.supabase.url || !CONFIG.supabase.serviceRoleKey) {
      throw new Error("Отсутствуют переменные окружения Supabase")
    }

    const cookieStore = cookies()

    return createServerClient(CONFIG.supabase.url, CONFIG.supabase.serviceRoleKey, {
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

// Трансформатор данных - ОБНОВЛЕН для работы с фронтендом
class DataTransformer {
  static transformOfferForUpdate(data: CommercialOfferUpdateData) {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Обрабатываем каждое поле индивидуально
    if (data.title !== undefined) updateData.title = SecurityUtils.sanitizeInput(data.title.trim())
    if (data.description !== undefined) updateData.description = data.description ? SecurityUtils.sanitizeInput(data.description.trim()) : null
    if (data.equipment !== undefined) updateData.equipment = data.equipment ? SecurityUtils.sanitizeInput(data.equipment.trim()) : null
    if (data.model !== undefined) updateData.model = data.model ? SecurityUtils.sanitizeInput(data.model.trim()) : null
    if (data.price !== undefined) updateData.price = SecurityUtils.parsePrice(data.price)
    if (data.price_with_vat !== undefined) updateData.price_with_vat = data.price_with_vat ? SecurityUtils.parsePrice(data.price_with_vat) : null
    if (data.currency !== undefined) updateData.currency = data.currency || "RUB"
    if (data.availability !== undefined) updateData.availability = data.availability ? SecurityUtils.sanitizeInput(data.availability.trim()) : "В наличии"
    if (data.payment_type !== undefined) updateData.payment_type = data.payment_type ? SecurityUtils.sanitizeInput(data.payment_type.trim()) : null
    if (data.lease !== undefined) updateData.lease = data.lease ? SecurityUtils.sanitizeInput(data.lease.trim()) : null
    if (data.vat_included !== undefined) updateData.vat_included = Boolean(data.vat_included)
    if (data.diagnostics_passed !== undefined) updateData.diagnostics_passed = Boolean(data.diagnostics_passed)
    if (data.image_url !== undefined) updateData.image_url = data.image_url ? SecurityUtils.sanitizeInput(data.image_url.trim()) : null
    if (data.header_image_url !== undefined) updateData.header_image_url = data.header_image_url ? SecurityUtils.sanitizeInput(data.header_image_url.trim()) : null
    if (data.specifications !== undefined) updateData.specifications = SecurityUtils.sanitizeSpecifications(data.specifications)
    if (data.post_to_telegram !== undefined) updateData.post_to_telegram = Boolean(data.post_to_telegram)
    if (data.channel_ids !== undefined) updateData.channel_ids = Array.isArray(data.channel_ids) ? data.channel_ids : []
    if (data.is_active !== undefined) updateData.is_active = Boolean(data.is_active)
    if (data.is_featured !== undefined) updateData.is_featured = Boolean(data.is_featured)
    if (data.footer_text !== undefined) updateData.footer_text = data.footer_text ? SecurityUtils.sanitizeInput(data.footer_text.trim()) : ""
    if (data.footer_font_size !== undefined) updateData.footer_font_size = data.footer_font_size || 12
    if (data.footer_alignment !== undefined) updateData.footer_alignment = data.footer_alignment || "center"
    if (data.footer_padding !== undefined) updateData.footer_padding = data.footer_padding || 15
    if (data.title_font_size !== undefined) updateData.title_font_size = data.title_font_size || 28
    if (data.equipment_font_size !== undefined) updateData.equipment_font_size = data.equipment_font_size || 16
    if (data.price_block_offset !== undefined) updateData.price_block_offset = data.price_block_offset || 0
    if (data.photo_scale !== undefined) updateData.photo_scale = data.photo_scale?.toString() || "1"
    if (data.offer_title !== undefined) updateData.offer_title = data.offer_title ? SecurityUtils.sanitizeInput(data.offer_title.trim()) : "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ"

    return updateData
  }
}

// Обработчик ошибок
class ErrorHandler {
  static handleDatabaseError(error: SupabaseError): NextResponse {
    Logger.error("Ошибка базы данных", error)

    if (error.code === "23505") {
      return NextResponse.json({ error: "Предложение уже существует" }, { status: 409 })
    }

    if (error.code === "42501") {
      return NextResponse.json({ error: "Ошибка доступа к базе данных" }, { status: 403 })
    }

    if (error.code === "22P02") {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 })
    }

    return NextResponse.json(
      {
        error: "Ошибка базы данных",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }

  static handleValidationError(errors: string[]): NextResponse {
    Logger.warn("Ошибка валидации", { errors })
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 })
  }

  static handleNotFoundError(message = "Ресурс не найден"): NextResponse {
    Logger.warn("Ресурс не найден", { message })
    return NextResponse.json({ error: message }, { status: 404 })
  }

  static handleServerError(error: any): NextResponse {
    Logger.error("Критическая ошибка сервера", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

// GET: Получение конкретного предложения по ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id || !OfferValidator.validateId(id)) {
      return ErrorHandler.handleValidationError(["Некорректный ID предложения"])
    }

    const supabase = SupabaseUtils.createClient()

    const { data, error } = await supabase
      .from("commercial_offers")
      .select('*')
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return ErrorHandler.handleNotFoundError("Коммерческое предложение не найдено")
      }
      Logger.error("Database error:", error)
      return ErrorHandler.handleDatabaseError(error)
    }

    Logger.info(`Получено коммерческое предложение: ${data.id}`)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    Logger.error("Ошибка получения предложения:", error)
    return ErrorHandler.handleServerError(error)
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

    let body: CommercialOfferUpdateData
    try {
      body = JSON.parse(text)
    } catch {
      return ErrorHandler.handleValidationError(["Неверный формат JSON"])
    }

    Logger.info("PATCH data received:", { id, body })

    // Валидация данных для обновления
    const validation = OfferValidator.validateUpdateData(body)
    if (!validation.isValid) {
      Logger.error("Validation errors:", validation.errors)
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
    Logger.info("Update data:", updateData)

    const { data, error } = await supabase
      .from("commercial_offers")
      .update(updateData)
      .eq("id", id)
      .select('*')
      .single()

    if (error) {
      Logger.error("Database update error:", error)
      return ErrorHandler.handleDatabaseError(error)
    }

    Logger.info(`Обновлено коммерческое предложение: ${data.id}`)

    return NextResponse.json({
      success: true,
      data,
      message: "Коммерческое предложение успешно обновлено",
    })
  } catch (error: any) {
    Logger.error("Ошибка обновления предложения:", error)
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

    // Проверка существования предложения
    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id, title")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return ErrorHandler.handleNotFoundError("Коммерческое предложение не найдено")
    }

    // Удаление предложения
    const { error } = await supabase.from("commercial_offers").delete().eq("id", id)

    if (error) {
      Logger.error("Database delete error:", error)
      return ErrorHandler.handleDatabaseError(error)
    }

    Logger.info(`Удалено коммерческое предложение: ${id} - ${existing.title}`)

    return NextResponse.json({
      success: true,
      message: "Коммерческое предложение успешно удалено",
    })
  } catch (error: any) {
    Logger.error("Ошибка удаления предложения:", error)
    return ErrorHandler.handleServerError(error)
  }
}

// OPTIONS: Для CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
