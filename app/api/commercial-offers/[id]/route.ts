import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
// import { parseCommercialOfferText } from "@/lib/commercial-offer-parser" // ← Закомментируем на время

// GET - получение конкретного коммерческого предложения
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from("commercial_offers")
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error(`[Commercial Offers] Error fetching offer ${params.id}:`, error)
      return NextResponse.json(
        { error: "Commercial offer not found" }, 
        { status: 404 }
      )
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error(`[Commercial Offers] Error in GET ${params.id}:`, error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// PUT - обновление коммерческого предложения
export async function PUT(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
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

    // Проверяем существование записи
    const { data: existingOffer, error: fetchError } = await supabase
      .from("commercial_offers")
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingOffer) {
      return NextResponse.json(
        { error: "Commercial offer not found" }, 
        { status: 404 }
      )
    }

    // Временно убираем логику парсинга
    let updateData = { ...body }
    
    // if (body.rawText) {
    //   const parsedData = parseCommercialOfferText(body.rawText)
    //   
    //   // Объединяем распарсенные данные с переданными (переданные имеют приоритет)
    //   updateData = {
    //     ...parsedData,
    //     ...body,
    //     rawText: undefined
    //   }
    // }

    // Подготавливаем данные для обновления
    const preparedData = {
      ...updateData,
      updated_at: new Date().toISOString(),
      // Маппинг полей для соответствия базе данных
      title: updateData.title,
      equipment: updateData.equipment,
      model: updateData.model,
      price: updateData.price,
      price_with_vat: updateData.priceWithVat ?? updateData.price_with_vat,
      availability: updateData.availability,
      payment_type: updateData.paymentType ?? updateData.payment_type,
      lease: updateData.lease ?? updateData.lease,
      vat_included: updateData.vatIncluded ?? updateData.vat_included,
      diagnostics_passed: updateData.diagnosticsPassed ?? updateData.diagnostics_passed,
      image_url: updateData.imageUrl ?? updateData.image_url,
      specifications: updateData.specifications ?? updateData.specifications,
      post_to_telegram: updateData.postToTelegram ?? updateData.post_to_telegram,
      channel_ids: updateData.channelIds ?? updateData.channel_ids,
      is_active: updateData.isActive ?? updateData.is_active,
      is_featured: updateData.isFeatured ?? updateData.is_featured,
    }

    // Удаляем undefined поля
    Object.keys(preparedData).forEach(key => {
      if (preparedData[key] === undefined) {
        delete preparedData[key]
      }
    })

    const { data, error } = await supabase
      .from("commercial_offers")
      .update(preparedData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error(`[Commercial Offers] Error updating offer ${params.id}:`, error)
      return NextResponse.json(
        { error: `Failed to update offer: ${error.message}` }, 
        { status: 400 }
      )
    }

    console.log(`[Commercial Offers] Updated offer: ${params.id}`)
    
    return NextResponse.json({ 
      success: true, 
      data
      // parsedData: body.rawText ? updateData : undefined // ← временно убираем
    })

  } catch (error) {
    console.error(`[Commercial Offers] Error in PUT ${params.id}:`, error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// DELETE - удаление коммерческого предложения (мягкое удаление)
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
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

    // Проверяем существование записи
    const { data: existingOffer, error: fetchError } = await supabase
      .from("commercial_offers")
      .select('id, title')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingOffer) {
      return NextResponse.json(
        { error: "Commercial offer not found" }, 
        { status: 404 }
      )
    }

    // Мягкое удаление (установка is_active = false) вместо физического удаления
    const { error } = await supabase
      .from("commercial_offers")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)

    if (error) {
      console.error(`[Commercial Offers] Error soft-deleting offer ${params.id}:`, error)
      return NextResponse.json(
        { error: `Failed to delete offer: ${error.message}` }, 
        { status: 400 }
      )
    }

    console.log(`[Commercial Offers] Soft-deleted offer: ${params.id} - ${existingOffer.title}`)
    
    return NextResponse.json({ 
      success: true,
      message: "Commercial offer deleted successfully"
    })

  } catch (error) {
    console.error(`[Commercial Offers] Error in DELETE ${params.id}:`, error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// PATCH - частичное обновление (например, только статуса)
export async function PATCH(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from("commercial_offers")
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error(`[Commercial Offers] Error patching offer ${params.id}:`, error)
      return NextResponse.json(
        { error: `Failed to update offer: ${error.message}` }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error(`[Commercial Offers] Error in PATCH ${params.id}:`, error)
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}
