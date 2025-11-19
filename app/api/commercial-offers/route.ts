import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { parseCommercialOfferText, CommercialOfferData } from "@/lib/commercial-offer-parser"

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

    const body = await request.json()

    // Поддержка двух режимов: прямой ввод данных или парсинг из текста
    let offerData: CommercialOfferData

    if (body.rawText) {
      // Режим парсинга из текста
      offerData = parseCommercialOfferText(body.rawText)
      
      // Дополнительные данные из запроса имеют приоритет над распарсенными
      if (body.title) offerData.title = body.title
      if (body.price) offerData.price = body.price
      if (body.imageUrl) offerData.imageUrl = body.imageUrl
    } else {
      // Прямой ввод данных
      offerData = {
        title: body.title,
        equipment: body.equipment,
        model: body.model,
        price: body.price,
        priceWithVat: body.priceWithVat,
        availability: body.availability,
        paymentType: body.paymentType,
        lease: body.lease,
        vatIncluded: body.vatIncluded,
        diagnosticsPassed: body.diagnosticsPassed,
        specifications: body.specifications,
      }
    }

    // Валидация обязательных полей
    if (!offerData.title) {
      return NextResponse.json(
        { error: "Title is required" }, 
        { status: 400 }
      )
    }

    if (!offerData.price || offerData.price <= 0) {
      return NextResponse.json(
        { error: "Valid price is required" }, 
        { status: 400 }
      )
    }

    // Подготовка данных для вставки
    const insertData = {
      title: offerData.title,
      description: offerData.equipment || "", // Используем equipment как описание
      equipment: offerData.equipment,
      model: offerData.model,
      price: offerData.price,
      price_with_vat: offerData.priceWithVat ?? true, // По умолчанию с НДС
      currency: "RUB",
      availability: offerData.availability || "В наличии",
      payment_type: offerData.paymentType || "Безналичная оплата",
      lease: offerData.lease ?? false,
      vat_included: offerData.vatIncluded ?? true,
      diagnostics_passed: offerData.diagnosticsPassed ?? false,
      image_url: body.imageUrl || null,
      specifications: offerData.specifications || {},
      is_active: true,
      is_featured: false,
      post_to_telegram: body.postToTelegram ?? false,
      channel_ids: body.channelIds || null,
    }

    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error("[Commercial Offers] Error saving to database:", error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` }, 
        { status: 400 }
      )
    }

    // Логирование успешного создания
    console.log(`[Commercial Offers] Created offer: ${data.id} - ${data.title}`)

    return NextResponse.json({ 
      success: true,
      data,
      parsedData: body.rawText ? offerData : undefined // Возвращаем распарсенные данные для отладки
    })

  } catch (error) {
    console.error("[Commercial Offers] Internal server error:", error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// Добавляем GET для получения списка коммерческих предложений
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const isActive = searchParams.get('isActive') !== 'false'
    
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from("commercial_offers")
      .select('*', { count: 'exact' })
      .eq('is_active', isActive)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error("[Commercial Offers] Error fetching data:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error("[Commercial Offers] Error in GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
