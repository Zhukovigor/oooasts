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
  validation: {
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE_MB || "10") * 1024 * 1024,
  },
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === "true",
    maxChannels: parseInt(process.env.TELEGRAM_MAX_CHANNELS || "10"),
  },
} as const

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
  footerText?: string
  footerPadding?: number
  titleFontSize?: number
  equipmentFontSize?: number
  priceBlockOffset?: number
  photoScale?: number
  offerTitle?: string
  currency?: string
}

interface SupabaseError {
  code: string
  message: string
  details?: string
  hint?: string
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
  SPECIFICATION_KEY_MAX_LENGTH: 100,
  SPECIFICATION_VALUE_MAX_LENGTH: 500,
} as const

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
setInterval(() => RateLimiter.cleanup(), 5 * 60 * 1000)

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
}

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

    const specsValidation = this.validateSpecifications(data.specifications)
    if (!specsValidation.isValid) {
      errors.push(...specsValidation.errors)
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
      const specsValidation = this.validateSpecifications(data.specifications)
      if (!specsValidation.isValid) {
        errors.push(...specsValidation.errors)
      }
    }

    if (data.currency && !SecurityUtils.validateCurrency(data.currency)) {
      errors.push("Некорректная валюта")
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

// Сервис для работы с изображениями
class ImageService {
  static async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: "HEAD", timeout: 5000 })
      const contentType = response.headers.get("content-type")
      return contentType?.startsWith("image/") || false
    } catch {
      return false
    }
  }

  static async getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
    try {
      // В реальной реализации можно получить размеры изображения
      return null
    } catch {
      return null
    }
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
  static transformOfferForInsert(data: CreateOfferData) {
    const now = new Date().toISOString()

    return {
      title: SecurityUtils.sanitizeInput(data.title.trim()),
      description: data.description ? SecurityUtils.sanitizeInput(data.description.trim()) : null,
      price: Math.round(data.price),
      price_with_vat: data.priceWithVat ? Math.round(data.priceWithVat) : null,
      availability: data.availability ? SecurityUtils.sanitizeInput(data.availability.trim()) : null,
      payment_type: data.paymentType ? SecurityUtils.sanitizeInput(data.paymentType.trim()) : null,
      vat_included: Boolean(data.vatIncluded),
      diagnostics_passed: Boolean(data.diagnosticsPassed),
      image_url: data.imageUrl?.trim() || null,
      header_image_url: data.headerImageUrl?.trim() || null,
      footer: data.footer ? SecurityUtils.sanitizeInput(data.footer.trim()) : null,
      footer_alignment: data.footerAlignment?.trim() || null,
      footer_font_size: data.footerFontSize || null,
      footer_font_family: data.footerFontFamily?.trim() || null,
      specifications: data.specifications || {},
      currency: "RUB",
      equipment: data.equipment ? SecurityUtils.sanitizeInput(data.equipment.trim()) : null,
      lease: data.lease ? SecurityUtils.sanitizeInput(data.lease.trim()) : null,
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

    if (data.title !== undefined) updateData.title = SecurityUtils.sanitizeInput(data.title.trim())
    if (data.description !== undefined)
      updateData.description = data.description ? SecurityUtils.sanitizeInput(data.description.trim()) : null
    if (data.price !== undefined) updateData.price = Math.round(data.price)
    if (data.priceWithVat !== undefined)
      updateData.price_with_vat = data.priceWithVat ? Math.round(data.priceWithVat) : null
    if (data.availability !== undefined)
      updateData.availability = data.availability ? SecurityUtils.sanitizeInput(data.availability.trim()) : null
    if (data.paymentType !== undefined)
      updateData.payment_type = data.paymentType ? SecurityUtils.sanitizeInput(data.paymentType.trim()) : null
    if (data.vatIncluded !== undefined) updateData.vat_included = Boolean(data.vatIncluded)
    if (data.diagnosticsPassed !== undefined) updateData.diagnostics_passed = Boolean(data.diagnosticsPassed)
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl?.trim() || null
    if (data.headerImageUrl !== undefined) updateData.header_image_url = data.headerImageUrl?.trim() || null
    if (data.footer !== undefined) updateData.footer = data.footer ? SecurityUtils.sanitizeInput(data.footer.trim()) : null
    if (data.footerAlignment !== undefined) updateData.footer_alignment = data.footerAlignment?.trim() || null
    if (data.footerFontSize !== undefined) updateData.footer_font_size = data.footerFontSize || null
    if (data.footerFontFamily !== undefined) updateData.footer_font_family = data.footerFontFamily?.trim() || null
    if (data.specifications !== undefined) updateData.specifications = data.specifications || {}
    if (data.equipment !== undefined)
      updateData.equipment = data.equipment ? SecurityUtils.sanitizeInput(data.equipment.trim()) : null
    if (data.lease !== undefined) updateData.lease = data.lease ? SecurityUtils.sanitizeInput(data.lease.trim()) : null
    if (data.isActive !== undefined) updateData.is_active = Boolean(data.isActive)
    if (data.isFeatured !== undefined) updateData.is_featured = Boolean(data.isFeatured)
    if (data.footerText !== undefined) updateData.footer_text = data.footerText ? SecurityUtils.sanitizeInput(data.footerText.trim()) : null
    if (data.footerPadding !== undefined) updateData.footer_padding = data.footerPadding || null
    if (data.titleFontSize !== undefined) updateData.title_font_size = data.titleFontSize || null
    if (data.equipmentFontSize !== undefined) updateData.equipment_font_size = data.equipmentFontSize || null
    if (data.priceBlockOffset !== undefined) updateData.price_block_offset = data.priceBlockOffset || null
    if (data.photoScale !== undefined) updateData.photo_scale = data.photoScale || null
    if (data.offerTitle !== undefined) updateData.offer_title = data.offerTitle ? SecurityUtils.sanitizeInput(data.offerTitle.trim()) : null
    if (data.currency !== undefined) updateData.currency = data.currency?.trim() || null

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

    // Проверка существования предложения с таким же названием
    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .ilike("title", body.title.trim())
      .limit(1)

    if (checkError) throw checkError
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

    const insertData = DataTransformer.transformOfferForInsert(body)

    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select(
        `
        id, title, description, price, price_with_vat, availability, 
        payment_type, conditions, header_image_url, footer, 
        footer_alignment, footer_font_size, footer_font_family,
        vat_included, diagnostics_passed, image_url, 
        specifications, currency, equipment, lease, created_at, 
        updated_at, is_active, is_featured, post_to_telegram, 
        channel_ids, telegram_posted
      `,
      )
      .single()

    if (error) {
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

    // Фоновая публикация в Telegram
    if (body.postToTelegram && body.channelIds?.length) {
      setImmediate(() => {
        TelegramService.publishOffer(data.id, body.channelIds!, request.nextUrl.origin).catch((err) =>
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

    // Параметры поиска и фильтрации
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

    // Применение фильтров
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
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()
  const clientId = SecurityUtils.getClientIdentifier(request)

  try {
    // Rate limiting
    if (!RateLimiter.check(clientId)) {
      Metrics.trackError("rate_limit_exceeded", { clientId })
      return ErrorHandler.handleRateLimitError()
    }

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

    const updateData = DataTransformer.transformOfferForUpdate(body)

    const { data, error } = await supabase
      .from("commercial_offers")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        id, title, description, price, price_with_vat, availability, 
        payment_type, conditions, header_image_url, footer_text,
        footer_alignment, footer_font_size,
        vat_included, diagnostics_passed, 
        image_url, specifications, currency, equipment, lease, 
        created_at, updated_at, is_active, is_featured,
        offer_title, title_font_size, equipment_font_size, price_block_offset, photo_scale, footer_padding
      `,
      )
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
    Metrics.trackRequest("PATCH", `/api/commercial-offers/${id}`, duration, 200)

    return NextResponse.json({
      success: true,
      data,
      message: "Коммерческое предложение успешно обновлено",
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    Metrics.trackRequest("PATCH", `/api/commercial-offers/${id}`, duration, 500)
    Logger.error("Ошибка обновления предложения:", error, { offerId: params.id, clientId })
    return ErrorHandler.handleServerError(error)
  }
}

// DELETE: Удаление коммерческого предложения
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()
  const clientId = SecurityUtils.getClientIdentifier(request)

  try {
    // Rate limiting
    if (!RateLimiter.check(clientId)) {
      Metrics.trackError("rate_limit_exceeded", { clientId })
      return ErrorHandler.handleRateLimitError()
    }

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
      Metrics.trackError("offer_not_found_delete", { offerId: id })
      return ErrorHandler.handleNotFoundError("Коммерческое предложение не найдено")
    }

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
    Metrics.trackRequest("DELETE", `/api/commercial-offers/${id}`, duration, 200)

    return NextResponse.json({
      success: true,
      message: "Коммерческое предложение успешно удалено",
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    Metrics.trackRequest("DELETE", `/api/commercial-offers/${id}`, duration, 500)
    Logger.error("Ошибка удаления предложения:", error, { offerId: params.id, clientId })
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
