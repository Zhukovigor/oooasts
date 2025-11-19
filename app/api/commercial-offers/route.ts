import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Получение и валидация тела запроса
    let body;
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: "Неверный формат JSON в теле запроса" },
        { status: 400 }
      )
    }

    // Валидация обязательных полей
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "Название техники обязательно для заполнения" },
        { status: 400 }
      )
    }

    if (!body.price || typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json(
        { error: "Цена должна быть положительным числом" },
        { status: 400 }
      )
    }

    // Валидация URL изображения (если предоставлен)
    if (body.imageUrl && !isValidUrl(body.imageUrl)) {
      return NextResponse.json(
        { error: "Некорректный URL изображения" },
        { status: 400 }
      )
    }

    // Валидация спецификаций
    if (body.specifications && typeof body.specifications !== 'object') {
      return NextResponse.json(
        { error: "Спецификации должны быть объектом" },
        { status: 400 }
      )
    }

    // Подготовка данных для вставки
    const insertData = {
      title: body.title.trim(),
      price: Math.round(body.price), // Округляем до целого числа
      price_with_vat: body.priceWithVat ? Math.round(body.priceWithVat) : null,
      availability: body.availability || null,
      payment_type: body.paymentType || null,
      vat_included: body.vatIncluded || false,
      diagnostics_passed: body.diagnosticsPassed || false,
      image_url: body.imageUrl || null,
      specifications: body.specifications || null,
      currency: "RUB",
      equipment: body.equipment || null,
      lease: body.lease || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Дополнительные поля для Telegram
      post_to_telegram: body.postToTelegram || false,
      channel_ids: body.channelIds || [],
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
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: "Коммерческое предложение с таким названием уже существует" },
          { status: 409 }
        )
      }
      
      if (error.code === '23503') { // Foreign key violation
        return NextResponse.json(
          { error: "Ошибка ссылочной целостности данных" },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: `Ошибка базы данных: ${error.message}` },
        { status: 500 }
      )
    }

    // Если нужно опубликовать в Telegram
    if (body.postToTelegram && body.channelIds && body.channelIds.length > 0) {
      try {
        // Отложенная публикация в Telegram
        setTimeout(async () => {
          try {
            const telegramResponse = await fetch(`${request.nextUrl.origin}/api/telegram/post`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                offerId: data.id,
                channelIds: body.channelIds
              })
            })

            if (telegramResponse.ok) {
              // Обновляем статус публикации
              await supabase
                .from('commercial_offers')
                .update({
                  telegram_posted: true,
                  telegram_message_id: (await telegramResponse.json()).messageId
                })
                .eq('id', data.id)
            }
          } catch (telegramError) {
            console.error('Error posting to Telegram:', telegramError)
          }
        }, 1000) // Задержка 1 секунда
      } catch (telegramError) {
        console.error('Error scheduling Telegram post:', telegramError)
        // Не прерываем основной поток из-за ошибки Telegram
      }
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Коммерческое предложение успешно создано",
      id: data.id
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating commercial offer:", error)
    
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при создании коммерческого предложения" },
      { status: 500 }
    )
  }
}

// Вспомогательная функция для валидации URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Опционально: можно добавить GET для получения списка предложений
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const { data, error, count } = await supabase
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
        telegram_posted
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Supabase select error:", error)
      return NextResponse.json(
        { error: "Ошибка при получении списка предложений" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error("Error fetching commercial offers:", error)
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    )
  }
}
