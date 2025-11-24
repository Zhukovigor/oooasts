// app/api/commercial-offers/route.ts
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
  validation: {
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE_MB || "10") * 1024 * 1024,
  },
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === "true",
    maxChannels: parseInt(process.env.TELEGRAM_MAX_CHANNELS || "10"),
  },
} as const

// Константы для валидации
const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  PRICE_MAX: 100000000000,
  SPECIFICATIONS_MAX_KEYS: 50,
  CHANNEL_IDS_MAX: 10,
  SEARCH_MAX_LENGTH: 100,
  PAGE_MAX: 1000,
  LIMIT_MAX: 100,
  STRING_FIELD_MAX_LENGTH: 500,
  IMAGE_URL_MAX_LENGTH: 2000,
  SPECIFICATION_KEY_MAX_LENGTH: 100,
  SPECIFICATION_VALUE_MAX_LENGTH: 500,
  MODEL_MAX_LENGTH: 100,
  CURRENCY_MAX_LENGTH: 10,
} as const

// Интерфейсы данных на основе структуры таблицы
interface CommercialOfferData {
  title: string
  description?: string | null
  equipment?: string | null
  model?: string | null
  price: number
  price_with_vat?: number | null
  currency?: string
  availability?: string | null
  payment_type?: string | null
  lease?: string | null
  vat_included?: boolean
  diagnostics_passed?: boolean
  image_url?: string | null
  specifications?: Record<string, string> | null
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

interface CommercialOfferUpdateData {
  title?: string
  description?: string | null
  equipment?: string | null
  model?: string | null
  price?: number
  price_with_vat?: number | null
  currency?: string
  availability?: string | null
  payment_type?: string | null
  lease?: string | null
  vat_included?: boolean
  diagnostics_passed?: boolean
  image_url?: string | null
  specifications?: Record<string, string> | null
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

  static debug(message: string, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        JSON.stringify({
          level: "debug",
          timestamp: new Date().toISOString(),
          message,
          ...metadata,
        }),
      )
    }
  }
}

// Rate Limiting
class RateLimiter {
  private static limits = new Map<string, number[]>()

  static check(identifier: string, limit: number = CONFIG.rateLimit.max, windowMs: number = CONFIG.rateLimit.windowMs): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    if (!this.limits.has(identifier)) {
      this.limits.set(identifier, [])
    }

    const requests = this.limits.get(identifier)!.filter((time) => time > windowStart)
    this.limits.set(identifier, requests)

    if (requests.length >= limit) {
      return false
    }

    requests.push(now)
    return true
  }

  static cleanup() {
    const now = Date.now()
    const windowStart = now - CONFIG.rateLimit.windowMs

    for (const [identifier, requests] of this.limits.entries()) {
      const filtered = requests.filter((time) => time > windowStart)
      if (filtered.length === 0) {
        this.limits.delete(identifier)
      } else {
        this.limits.set(identifier, filtered)
      }
    }
  }
}

// Запускаем очистку каждые 5 минут
if (typeof setInterval !== 'undefined') {
  setInterval(() => RateLimiter.cleanup(), 5 * 60 * 1000)
}

// Метрики
class Metrics {
  static async trackRequest(method: string, endpoint: string, duration: number, status: number, userId?: string) {
    Logger.debug("Request metric", {
      method,
      endpoint,
      duration,
      status,
      userId,
    })
  }

  static async trackError(errorType: string, context: Record<string, any>) {
    Logger.error(`Error metric: ${errorType}`, null, context)
  }

  static async trackBusinessEvent(event: string, offerId: string, metadata?: Record<string, any>) {
    Logger.info(`Business event: ${event}`, { offerId, ...metadata })
  }
}

// Утилиты безопасности
class SecurityUtils {
  static sanitizeInput(input: string): string {
    if (!input) return ""
    return input
      .replace(/[<>]/g, "") // Удаляем опасные HTML теги
      .replace(/javascript:/gi, "") // Удаляем JavaScript схемы
      .trim()
  }

  static validateCurrency(currency: string): boolean {
    const allowedCurrencies = ["RUB", "USD", "EUR"]
    return allowedCurrencies.includes(currency)
  }

  static generateId(): string {
    return crypto.randomUUID()
  }

  static getClientIdentifier(request: NextRequest): string {
    return request.ip || request.headers.get("x-forwarded-for") || "unknown"
  }

  static sanitizeSpecifications(specs: Record<string, string> | null): Record<string, string> {
    if (!specs) return {}
    
    const sanitized: Record<string, string> = {}
    for (const [key, value] of Object.entries(specs)) {
      sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value)
    }
    return sanitized
  }
}

// Улучшенная валидация
class OfferValidator {
  static validateCreateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Валидация названия
    if (!data.title || !data.title.trim()) {
      errors.push("Название техники обязательно для заполнения")
    } else if (data.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
      errors.push(`Название не может превышать ${VALIDIDATION_LIMITS.TITLE_MAX_LENGTH} символов`)
    }

    // Валидация цены
    if (data.price === undefined || data.price === null) {
      errors.push("Цена обязательна для заполнения")
    } else if (typeof data.price !== "number" || isNaN(data.price) || data.price < 0) {
      errors.push("Цена должна быть положительным числом")
    } else if (data.price > VALIDATION_LIMITS.PRICE_MAX) {
      errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
    }

    // Валидация цены с НДС
    if (data.price_with_vat !== undefined && data.price_with_vat !== null) {
      if (typeof data.price_with_vat !== "number" || isNaN(data.price_with_vat) || data.price_with_vat < 0) {
        errors.push("Цена с НДС должна быть положительным числом")
      } else if (data.price_with_vat > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена с НДС не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
      }
    }

    // Валидация URL изображения
    if (data.image_url && !this.isValidImageUrl(data.image_url)) {
      errors.push("Некорректный URL изображения")
    }

    if (data.header_image_url && !this.isValidImageUrl(data.header_image_url)) {
      errors.push("Некорректный URL заголовочного изображения")
    }

    // Валидация спецификаций
    const specsValidation = this.validateSpecifications(data.specifications)
    if (!specsValidation.isValid) {
      errors.push(...specsValidation.errors)
    }

    // Валидация каналов Telegram
    if (data.channel_ids) {
      if (!Array.isArray(data.channel_ids)) {
        errors.push("channel_ids должен быть массивом")
      } else if (data.channel_ids.length > VALIDATION_LIMITS.CHANNEL_IDS_MAX) {
        errors.push(`Слишком много каналов (максимум ${VALIDATION_LIMITS.CHANNEL_IDS_MAX})`)
      } else if (data.channel_ids.some((id: any) => typeof id !== "string" || !id.trim())) {
        errors.push("Все channel_ids должны быть непустыми строками")
      }
    }

    // Валидация строковых полей
    const stringFields = [
      "description",
      "equipment",
      "model",
      "availability",
      "payment_type",
      "lease",
      "footer_text",
      "offer_title",
      "currency",
    ] as const

    stringFields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null) {
        if (typeof data[field] !== "string") {
          errors.push(`Поле ${field} должно быть строкой`)
        } else {
          const maxLength = this.getMaxLengthForField(field)
          if (data[field].length > maxLength) {
            errors.push(`Поле ${field} не может превышать ${maxLength} символов`)
          }
        }
      }
    })

    // Валидация числовых полей
    const numericFields = [
      "footer_font_size",
      "footer_padding",
      "title_font_size",
      "equipment_font_size",
      "price_block_offset",
    ] as const

    numericFields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null) {
        if (typeof data[field] !== "number" || isNaN(data[field])) {
          errors.push(`Поле ${field} должно быть числом`)
        }
      }
    })

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
      if (typeof data.price !== "number" || isNaN(data.price) || data.price < 0) {
        errors.push("Цена должна быть положительным числом")
      } else if (data.price > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
      }
    }

    // Валидация цены с НДС если передана
    if (data.price_with_vat !== undefined && data.price_with_vat !== null) {
      if (typeof data.price_with_vat !== "number" || isNaN(data.price_with_vat) || data.price_with_vat < 0) {
        errors.push("Цена с НДС должна быть положительным числом")
      } else if (data.price_with_vat > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена с НДС не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString("ru-RU")} руб.`)
      }
    }

    // Валидация URL изображения если передан
    if (data.image_url && !this.isValidImageUrl(data.image_url)) {
      errors.push("Некорректный URL изображения")
    }

    if (data.header_image_url && !this.isValidImageUrl(data.header_image_url)) {
      errors.push("Некорректный URL заголовочного изображения")
    }

    // Валидация спецификаций если переданы
    if (data.specifications !== undefined) {
      const specsValidation = this.validateSpecifications(data.specifications)
      if (!specsValidation.isValid) {
        errors.push(...specsValidation.errors)
      }
    }

    // Валидация строковых полей
    const stringFields = [
      "description",
      "equipment",
      "model",
      "availability",
      "payment_type",
      "lease",
      "footer_text",
      "offer_title",
      "currency",
    ] as const

    stringFields.forEach((field) => {
      if (data[field] !== undefined && data[field] !== null) {
        if (typeof data[field] !== "string") {
          errors.push(`Поле ${field} должно быть строкой`)
        } else {
          const maxLength = this.getMaxLengthForField(field)
          if (data[field].length > maxLength) {
            errors.push(`Поле ${field} не может превышать ${maxLength} символов`)
          }
        }
      }
    })

    return { isValid: errors.length === 0, errors }
  }

  static validateSpecifications(specs: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (specs === undefined || specs === null) {
      return { isValid: true, errors }
    }

    if (typeof specs !== "object" || Array.isArray(specs)) {
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

  static getMaxLengthForField(field: string): number {
    const maxLengths: Record<string, number> = {
      description: VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH,
      model: VALIDATION_LIMITS.MODEL_MAX_LENGTH,
      currency: VALIDATION_LIMITS.CURRENCY_MAX_LENGTH,
      offer_title: VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH,
    }

    return maxLengths[field] || VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH
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

// Сервис для работы с Telegram
class TelegramService {
  static async publishOffer(offerId: string, channelIds: string[], origin: string) {
    if (!CONFIG.telegram.enabled) {
      Logger.debug("Telegram integration disabled", { offerId })
      return
    }

    try {
      const response = await fetch(`${origin}/api/telegram/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          channelIds: channelIds.slice(0, CONFIG.telegram.maxChannels),
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Telegram API error (${response.status}): ${text}`)
      }

      const result = await response.json()
      Logger.info(`Успешная публикация в Telegram для предложения ${offerId}`)
      Metrics.trackBusinessEvent("telegram_publish_success", offerId, { channelIds })
      return result
    } catch (error) {
      Logger.error("Ошибка при публикации в Telegram:", error, { offerId, channelIds })
      Metrics.trackBusinessEvent("telegram_publish_failed", offerId, { error: error.message })
      throw error
    }
  }
}

// Трансформатор данных
class DataTransformer {
  static transformOfferForInsert(data: CommercialOfferData) {
    const now = new Date().toISOString()

    return {
      title: SecurityUtils.sanitizeInput(data.title.trim()),
      description: data.description ? SecurityUtils.sanitizeInput(data.description.trim()) : null,
      equipment: data.equipment ? SecurityUtils.sanitizeInput(data.equipment.trim()) : null,
      model: data.model ? SecurityUtils.sanitizeInput(data.model.trim()) : null,
      price: Math.round(data.price),
      price_with_vat: data.price_with_vat ? Math.round(data.price_with_vat) : null,
      currency: data.currency || "RUB",
      availability: data.availability ? SecurityUtils.sanitizeInput(data.availability.trim()) : null,
      payment_type: data.payment_type ? SecurityUtils.sanitizeInput(data.payment_type.trim()) : null,
      lease: data.lease ? SecurityUtils.sanitizeInput(data.lease.trim()) : null,
      vat_included: Boolean(data.vat_included),
      diagnostics_passed: Boolean(data.diagnostics_passed),
      image_url: data.image_url?.trim() || null,
      header_image_url: data.header_image_url?.trim() || null,
      specifications: data.specifications ? SecurityUtils.sanitizeSpecifications(data.specifications) : {},
      post_to_telegram: Boolean(data.post_to_telegram),
      channel_ids: Array.isArray(data.channel_ids) ? data.channel_ids.slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX) : [],
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      is_featured: Boolean(data.is_featured) || false,
      footer_text: data.footer_text ? SecurityUtils.sanitizeInput(data.footer_text.trim()) : null,
      footer_font_size: data.footer_font_size || 12,
      footer_alignment: data.footer_alignment || "center",
      footer_padding: data.footer_padding || 15,
      title_font_size: data.title_font_size || 28,
      equipment_font_size: data.equipment_font_size || 16,
      price_block_offset: data.price_block_offset || 0,
      photo_scale: data.photo_scale?.toString() || "1",
      offer_title: data.offer_title ? SecurityUtils.sanitizeInput(data.offer_title.trim()) : "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ",
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
    const fields = [
      "title", "description", "equipment", "model", "price", "price_with_vat", "currency",
      "availability", "payment_type", "lease", "vat_included", "diagnostics_passed",
      "image_url", "header_image_url", "specifications", "post_to_telegram", "channel_ids",
      "is_active", "is_featured", "footer_text", "footer_font_size", "footer_alignment",
      "footer_padding", "title_font_size", "equipment_font_size", "price_block_offset",
      "photo_scale", "offer_title"
    ] as const

    fields.forEach(field => {
      if (data[field] !== undefined) {
        if (typeof data[field] === "string" && field !== "specifications" && field !== "channel_ids") {
          updateData[field] = SecurityUtils.sanitizeInput(data[field] as string)
        } else if (field === "specifications" && data.specifications) {
          updateData[field] = SecurityUtils.sanitizeSpecifications(data.specifications)
        } else if (field === "channel_ids" && data.channel_ids) {
          updateData[field] = data.channel_ids.slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX)
        } else if (field === "photo_scale" && data.photo_scale !== undefined) {
          updateData[field] = data.photo_scale.toString()
        } else {
          updateData[field] = data[field]
        }
      }
    })

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

  static handleRateLimitError(): NextResponse {
    Logger.warn("Превышен лимит запросов")
    return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 })
  }

  static handleMethodNotAllowed(): NextResponse {
    return NextResponse.json({ error: "Метод не разрешен" }, { status: 405 })
  }
}

// Кэширование
class CacheService {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static readonly TTL = 5 * 60 * 1000 // 5 минут

  static get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  static set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  static delete(key: string): void {
    this.cache.delete(key)
  }

  static clear(): void {
    this.cache.clear()
  }
}

// Основные обработчики API

// POST: Создание коммерческого предложения
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientId = SecurityUtils.getClientIdentifier(request)

  try {
    // Rate limiting
    if (!RateLimiter.check(clientId)) {
      Metrics.trackError("rate_limit_exceeded", { clientId })
      return ErrorHandler.handleRateLimitError()
    }

    const text = await request.text()
    if (!text.trim()) {
      return ErrorHandler.handleValidationError(["Тело запроса не может быть пустым"])
    }

    let body: CommercialOfferData
    try {
      body = JSON.parse(text)
    } catch (error) {
      Logger.error("JSON parse error:", error)
      return ErrorHandler.handleValidationError(["Неверный формат JSON"])
    }

    Logger.debug("Received POST data:", body)

    // Валидация данных
    const validation = OfferValidator.validateCreateData(body)
    if (!validation.isValid) {
      Logger.error("Validation errors:", null, { errors: validation.errors })
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
      Logger.error("Check error:", checkError)
      throw checkError
    }

    if (existing?.length > 0) {
      Metrics.trackBusinessEvent("offer_creation_duplicate", existing[0].id, { title: body.title })
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
    Logger.debug("Insert data:", insertData)

    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select('*')
      .single()

    if (error) {
      Logger.error("Database error:", error)
      Metrics.trackError("database_insert_error", error)
      return ErrorHandler.handleDatabaseError(error)
    }

    Logger.info(`Создано коммерческое предложение: ${data.id} - ${data.title}`, {
      offerId: data.id,
      title: data.title,
      price: data.price,
    })

    Metrics.trackBusinessEvent("offer_created", data.id, {
      title: data.title,
      price: data.price,
      hasImage: !!data.image_url,
    })

    // Асинхронная публикация в Telegram (не блокируем ответ)
    if (body.post_to_telegram && body.channel_ids?.length) {
      setImmediate(() => {
        TelegramService.publishOffer(data.id, body.channel_ids!, request.nextUrl.origin).catch((err) =>
          Logger.error("Фоновая ошибка Telegram:", err, { offerId: data.id }),
        )
      })
    }

    const duration = Date.now() - startTime
    Metrics.trackRequest("POST", "/api/commercial-offers", duration, 201)

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
    const duration = Date.now() - startTime
    Metrics.trackRequest("POST", "/api/commercial-offers", duration, 500)
    Metrics.trackError("offer_creation_error", error, { clientId })
    return ErrorHandler.handleServerError(error)
  }
}

// GET: Получение списка предложений
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const clientId = SecurityUtils.getClientIdentifier(request)

  try {
    // Rate limiting
    if (!RateLimiter.check(clientId)) {
      Metrics.trackError("rate_limit_exceeded", { clientId })
      return ErrorHandler.handleRateLimitError()
    }

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

    // Ключ для кэша
    const cacheKey = `offers:${page}:${limit}:${search}:${isActive}:${isFeatured}`

    // Проверка кэша
    if (process.env.NODE_ENV === "production") {
      const cached = CacheService.get(cacheKey)
      if (cached) {
        const duration = Date.now() - startTime
        Metrics.trackRequest("GET", "/api/commercial-offers", duration, 200)
        Logger.debug("Cache hit", { cacheKey })
        return NextResponse.json(cached)
      }
    }

    // Построение запроса
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

    if (error) {
      Metrics.trackError("database_query_error", error)
      throw error
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    const responseData = {
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
    }

    // Сохранение в кэш
    if (process.env.NODE_ENV === "production") {
      CacheService.set(cacheKey, responseData)
    }

    const duration = Date.now() - startTime
    Metrics.trackRequest("GET", "/api/commercial-offers", duration, 200)

    return NextResponse.json(responseData)
  } catch (error) {
    const duration = Date.now() - startTime
    Metrics.trackRequest("GET", "/api/commercial-offers", duration, 500)
    Logger.error("Ошибка получения списка предложений:", error, { clientId })
    return NextResponse.json({ error: "Ошибка сервера при получении данных" }, { status: 500 })
  }
}

// PATCH: Обновление коммерческого предложения
export async function PATCH(request: NextRequest) {
  const startTime = Date.now()
  const clientId = SecurityUtils.getClientIdentifier(request)

  try {
    // Rate limiting
    if (!RateLimiter.check(clientId)) {
      Metrics.trackError("rate_limit_exceeded", { clientId })
      return ErrorHandler.handleRateLimitError()
    }

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

    // Валидация данных для обновления
    const validation = OfferValidator.validateUpdateData(body)
    if (!validation.isValid) {
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
      Metrics.trackError("offer_not_found", { offerId: id })
      return ErrorHandler.handleNotFoundError("Коммерческое предложение не найдено")
    }

    // Подготовка данных для обновления
    const updateData = DataTransformer.transformOfferForUpdate(body)

    const { data, error } = await supabase
      .from("commercial_offers")
      .update(updateData)
      .eq("id", id)
      .select('*')
      .single()

    if (error) {
      Metrics.trackError("database_update_error", error, { offerId: id })
      return ErrorHandler.handleDatabaseError(error)
    }

    // Очистка кэша
    CacheService.clear()

    Logger.info(`Обновлено коммерческое предложение: ${data.id}`, {
      offerId: data.id,
      updatedFields: Object.keys(body),
    })

    Metrics.trackBusinessEvent("offer_updated", data.id, {
      updatedFields: Object.keys(body),
    })

    const duration = Date.now() - startTime
    Metrics.trackRequest("PATCH", `/api/commercial-offers?id=${id}`, duration, 200)

    return NextResponse.json({
      success: true,
      data,
      message: "Коммерческое предложение успешно обновлено",
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    Metrics.trackRequest("PATCH", "/api/commercial-offers", duration, 500)
    Logger.error("Ошибка обновления предложения:", error, { clientId })
    return ErrorHandler.handleServerError(error)
  }
}

// DELETE: Удаление коммерческого предложения
export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  const clientId = SecurityUtils.getClientIdentifier(request)

  try {
    // Rate limiting
    if (!RateLimiter.check(clientId)) {
      Metrics.trackError("rate_limit_exceeded", { clientId })
      return ErrorHandler.handleRateLimitError()
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

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
      Metrics.trackError("offer_not_found_delete", { offerId: id })
      return ErrorHandler.handleNotFoundError("Коммерческое предложение не найдено")
    }

    // Удаление предложения
    const { error } = await supabase.from("commercial_offers").delete().eq("id", id)

    if (error) {
      Metrics.trackError("database_delete_error", error, { offerId: id })
      return ErrorHandler.handleDatabaseError(error)
    }

    // Очистка кэша
    CacheService.clear()

    Logger.info(`Удалено коммерческое предложение: ${id} - ${existing.title}`, {
      offerId: id,
      title: existing.title,
    })

    Metrics.trackBusinessEvent("offer_deleted", id, {
      title: existing.title,
    })

    const duration = Date.now() - startTime
    Metrics.trackRequest("DELETE", `/api/commercial-offers?id=${id}`, duration, 200)

    return NextResponse.json({
      success: true,
      message: "Коммерческое предложение успешно удалено",
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    Metrics.trackRequest("DELETE", "/api/commercial-offers", duration, 500)
    Logger.error("Ошибка удаления предложения:", error, { clientId })
    return ErrorHandler.handleServerError(error)
  }
}

// OPTIONS: Для CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
