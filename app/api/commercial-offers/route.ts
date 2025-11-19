import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// Константы для валидации
const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  PRICE_MAX: 1000000000,
  SPECIFICATIONS_MAX_KEYS: 50,
  CHANNEL_IDS_MAX: 10,
  PAGE_MAX: 1000,
  LIMIT_MAX: 100,
  STRING_FIELD_MAX_LENGTH: 500
} as const

// Валидация данных создания
function validateCreateData(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Валидация названия
  if (!body.title || !body.title.trim()) {
    errors.push("Название техники обязательно для заполнения")
  } else if (body.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
    errors.push(`Название не может превышать ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} символов`)
  }

  // Валидация цены
  if (body.price === undefined || body.price === null) {
    errors.push("Цена обязательна для заполнения")
  } else if (typeof body.price !== 'number' || isNaN(body.price) || body.price < 0) {
    errors.push("Цена должна быть положительным числом")
  } else if (body.price > VALIDATION_LIMITS.PRICE_MAX) {
    errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString('ru-RU')} руб.`)
  }

  // Валидация цены с НДС
  if (body.priceWithVat !== undefined && body.priceWithVat !== null) {
    if (typeof body.priceWithVat !== 'number' || isNaN(body.priceWithVat) || body.priceWithVat < 0) {
      errors.push("Цена с НДС должна быть положительным числом")
    } else if (body.priceWithVat > VALIDATION_LIMITS.PRICE_MAX) {
      errors.push(`Цена с НДС не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString('ru-RU')} руб.`)
    }
  }

  // Валидация URL изображения
  if (body.imageUrl && !isValidUrl(body.imageUrl)) {
    errors.push("Некорректный URL изображения")
  }

  // Валидация спецификаций
  if (body.specifications && typeof body.specifications !== 'object') {
    errors.push("Спецификации должны быть объектом")
  } else if (body.specifications && Object.keys(body.specifications).length > VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS) {
    errors.push(`Слишком много характеристик (максимум ${VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS})`)
  }

  // Валидация channelIds
  if (body.channelIds) {
    if (!Array.isArray(body.channelIds)) {
      errors.push("ChannelIds должен быть массивом")
    } else if (body.channelIds.length > VALIDATION_LIMITS.CHANNEL_IDS_MAX) {
      errors.push(`Слишком много каналов (максимум ${VALIDATION_LIMITS.CHANNEL_IDS_MAX})`)
    } else if (body.channelIds.some((id: any) => typeof id !== 'string' || !id.trim())) {
      errors.push("Все channelIds должны быть непустыми строками")
    }
  }

  // Валидация строковых полей
  const stringFields = ['availability', 'paymentType', 'lease', 'equipment'] as const
  stringFields.forEach(field => {
    if (body[field] && typeof body[field] !== 'string') {
      errors.push(`Поле ${field} должно быть строкой`)
    } else if (body[field] && body[field].length > VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH) {
      errors.push(`Поле ${field} не может превышать ${VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH} символов`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Функция для безопасной инициализации Supabase клиента
function createSupabaseClient() {
  const cookieStore = cookies()
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required environment variables")
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  let supabase;
  
  try {
    supabase = createSupabaseClient()
  } catch (error) {
    console.error("Supabase client initialization error:", error)
    return NextResponse.json(
      { error: "Ошибка инициализации базы данных" },
      { status: 500 }
    )
  }

  // Получение и валидация тела запроса
  let body: any;
  try {
    const text = await request.text()
    if (!text.trim()) {
      return NextResponse.json(
        { error: "Тело запроса не может быть пустым" },
        { status: 400 }
      )
    }
    body = JSON.parse(text)
  } catch (parseError) {
    return NextResponse.json(
      { error: "Неверный формат JSON в теле запроса" },
      { status: 400 }
    )
  }

  // Расширенная валидация данных
  const validation = validateCreateData(body)
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.errors.join(", ") },
      { status: 400 }
    )
  }

  try {
    // Проверка дубликатов по названию
    const { data: existingOffers, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .ilike("title", body.title.trim())
      .limit(1)

    if (checkError) {
      console.error("Supabase duplicate check error:", checkError)
      return NextResponse.json(
        { error: "Ошибка при проверке дубликатов" },
        { status: 500 }
      )
    }

    if (existingOffers && existingOffers.length > 0) {
      return NextResponse.json(
        { error: "Коммерческое предложение с таким названием уже существует" },
        { status: 409 }
      )
    }

    // Подготовка данных для вставки
    const now = new Date().toISOString()
    const insertData = {
      title: body.title.trim(),
      price: Math.round(body.price),
      price_with_vat: body.priceWithVat ? Math.round(body.priceWithVat) : null,
      availability: body.availability?.trim() || null,
      payment_type: body.paymentType?.trim() || null,
      vat_included: Boolean(body.vatIncluded),
      diagnostics_passed: Boolean(body.diagnosticsPassed),
      image_url: body.imageUrl?.trim() || null,
      specifications: body.specifications || {},
      currency: "RUB",
      equipment: body.equipment?.trim() || null,
      lease: body.lease?.trim() || null,
      created_at: now,
      updated_at: now,
      is_active: true,
      post_to_telegram: Boolean(body.postToTelegram),
      channel_ids: Array.isArray(body.channelIds) ? 
        body.channelIds.filter((id: any) => typeof id === 'string' && id.trim()).slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX) : [],
      telegram_posted: false,
      telegram_message_id: null
    }

    // Вставка данных в базу
    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select(`
        id,
        title,
        price,
        price_with_vat,
        availability,
        payment_type,
        vat_included,
        diagnostics_passed,
        image_url,
        specifications,
        currency,
        equipment,
        lease,
        created_at,
        updated_at,
        post_to_telegram,
        channel_ids,
        telegram_posted
      `)
      .single()

    if (error) {
      console.error("Supabase insert error:", error)
      
      // Обработка специфических ошибок Supabase
      switch (error.code) {
        case '23505': // Unique violation
          return NextResponse.json(
            { error: "Коммерческое предложение с таким названием уже существует" },
            { status: 409 }
          )
        case '23503': // Foreign key violation
          return NextResponse.json(
            { error: "Ошибка ссылочной целостности данных" },
            { status: 400 }
          )
        case '22001': // String length exceeds limit
          return NextResponse.json(
            { error: "Превышена максимальная длина одного из полей" },
            { status: 400 }
          )
        case '22003': // Numeric value out of range
          return NextResponse.json(
            { error: "Числовое значение выходит за допустимые пределы" },
            { status: 400 }
          )
        default:
          return NextResponse.json(
            { error: `Ошибка базы данных: ${error.message}` },
            { status: 500 }
          )
      }
    }

    // Логируем успешное создание
    console.log(`Commercial offer created: ${data.id} - ${data.title}`)

    // Публикация в Telegram (асинхронно, не блокируем ответ)
    if (body.postToTelegram && body.channelIds && body.channelIds.length > 0) {
      // Используем микрозадачу для асинхронной обработки
      Promise.resolve().then(async () => {
        try {
          await publishToTelegram(data.id, body.channelIds, request.nextUrl.origin)
        } catch (telegramError) {
          console.error('Telegram publication failed:', telegramError)
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Коммерческое предложение успешно создано",
      id: data.id
    }, { status: 201 })

  } catch (error) {
    console.error("Unexpected error creating commercial offer:", error)
    
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при создании коммерческого предложения" },
      { status: 500 }
    )
  }
}

// Функция для публикации в Telegram
async function publishToTelegram(offerId: string, channelIds: string[], origin: string) {
  try {
    const telegramResponse = await fetch(`${origin}/api/telegram/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offerId: offerId,
        channelIds: channelIds.slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX)
      })
    })

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text()
      throw new Error(`Telegram API responded with status: ${telegramResponse.status} - ${errorText}`)
    }

    const result = await telegramResponse.json()
    
    // Обновляем статус публикации в базе данных
    const supabase = createSupabaseClient()

    const { error: updateError } = await supabase
      .from('commercial_offers')
      .update({
        telegram_posted: true,
        telegram_message_id: result.messageId,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)

    if (updateError) {
      console.error('Error updating Telegram status:', updateError)
      throw updateError
    }

    console.log(`Telegram publication successful for offer: ${offerId}`)
    return result

  } catch (error) {
    console.error('Error in Telegram publication:', error)
    throw error
  }
}

// GET для получения списка предложений с фильтрацией
export async function GET(request: NextRequest) {
  let supabase;
  
  try {
    supabase = createSupabaseClient()
  } catch (error) {
    console.error("Supabase client initialization error:", error)
    return NextResponse.json(
      { error: "Ошибка инициализации базы данных" },
      { status: 500 }
    )
  }

  try {
    const url = new URL(request.url)
    
    // Валидация параметров пагинации
    const page = Math.max(1, Math.min(VALIDATION_LIMITS.PAGE_MAX, parseInt(url.searchParams.get('page') || '1')))
    const limit = Math.max(1, Math.min(VALIDATION_LIMITS.LIMIT_MAX, parseInt(url.searchParams.get('limit') || '10')))
    const offset = (page - 1) * limit
    
    // Валидация поискового запроса
    let search = url.searchParams.get('search')?.trim() || null
    if (search && search.length > VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH) {
      search = search.substring(0, VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH)
    }

    const isActive = url.searchParams.get('is_active')

    // Базовый запрос
    let query = supabase
      .from("commercial_offers")
      .select(`
        id,
        title,
        price,
        price_with_vat,
        availability,
        image_url,
        created_at,
        updated_at,
        telegram_posted,
        is_active,
        equipment
      `, { count: 'exact' })
      .eq('is_active', true) // По умолчанию только активные

    // Применяем фильтры
    if (search) {
      query = query.or(`title.ilike.%${search}%,equipment.ilike.%${search}%`)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    // Выполняем запрос с сортировкой и пагинацией
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Supabase select error:", error)
      return NextResponse.json(
        { error: "Ошибка при получении списка предложений" },
        { status: 500 }
      )
    }

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
        hasPrev: page > 1
      },
      filters: {
        search: search,
        isActive: isActive || null
      }
    })

  } catch (error) {
    console.error("Unexpected error fetching commercial offers:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при получении списка предложений" },
      { status: 500 }
    )
  }
}

// Вспомогательная функция для валидации URL
function isValidUrl(url: string): boolean {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    const allowedProtocols = ['http:', 'https:']
    
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false
    }
    
    // Базовая проверка домена
    if (!urlObj.hostname.includes('.') && urlObj.hostname !== 'localhost') {
      return false
    }
    
    return true
  } catch {
    return false
  }
}
