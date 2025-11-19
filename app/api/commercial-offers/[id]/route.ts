import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Валидация ID
    const offerId = params.id
    if (!offerId) {
      return NextResponse.json(
        { error: "ID коммерческого предложения обязателен" },
        { status: 400 }
      )
    }

    // Получение и валидация тела запроса
    const body = await request.json()
    
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Тело запроса не может быть пустым" },
        { status: 400 }
      )
    }

    // Валидация обязательных полей при обновлении
    if (body.title !== undefined && !body.title.trim()) {
      return NextResponse.json(
        { error: "Название техники обязательно" },
        { status: 400 }
      )
    }

    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
      return NextResponse.json(
        { error: "Цена должна быть положительным числом" },
        { status: 400 }
      )
    }

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

    // Проверяем существование предложения перед обновлением
    const { data: existingOffer, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .eq("id", offerId)
      .single()

    if (checkError || !existingOffer) {
      return NextResponse.json(
        { error: "Коммерческое предложение не найдено" },
        { status: 404 }
      )
    }

    // Подготавливаем данные для обновления
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    // Выполняем обновление
    const { data, error } = await supabase
      .from("commercial_offers")
      .update(updateData)
      .eq("id", offerId)
      .select()
      .single()

    if (error) {
      console.error("Supabase update error:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Коммерческое предложение успешно обновлено"
    })

  } catch (error) {
    console.error("Error updating commercial offer:", error)
    
    if (error instanceof Error) {
      if (error.message.includes("JSON")) {
        return NextResponse.json(
          { error: "Неверный формат JSON в теле запроса" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при обновлении коммерческого предложения" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Валидация ID
    const offerId = params.id
    if (!offerId) {
      return NextResponse.json(
        { error: "ID коммерческого предложения обязателен" },
        { status: 400 }
      )
    }

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

    // Проверяем существование предложения перед удалением
    const { data: existingOffer, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id, title")
      .eq("id", offerId)
      .single()

    if (checkError || !existingOffer) {
      return NextResponse.json(
        { error: "Коммерческое предложение не найдено" },
        { status: 404 }
      )
    }

    // Выполняем удаление
    const { error } = await supabase
      .from("commercial_offers")
      .delete()
      .eq("id", offerId)

    if (error) {
      console.error("Supabase delete error:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Коммерческое предложение "${existingOffer.title}" успешно удалено`,
      deletedId: offerId
    })

  } catch (error) {
    console.error("Error deleting commercial offer:", error)

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при удалении коммерческого предложения" },
      { status: 500 }
    )
  }
}

// Опционально: можно добавить метод PATCH для частичного обновления
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const offerId = params.id
    if (!offerId) {
      return NextResponse.json(
        { error: "ID коммерческого предложения обязателен" },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "Тело запроса не может быть пустым" },
        { status: 400 }
      )
    }

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

    // Проверяем существование предложения
    const { data: existingOffer, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .eq("id", offerId)
      .single()

    if (checkError || !existingOffer) {
      return NextResponse.json(
        { error: "Коммерческое предложение не найдено" },
        { status: 404 }
      )
    }

    // Подготавливаем данные для частичного обновления
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("commercial_offers")
      .update(updateData)
      .eq("id", offerId)
      .select()
      .single()

    if (error) {
      console.error("Supabase patch error:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Коммерческое предложение успешно обновлено"
    })

  } catch (error) {
    console.error("Error patching commercial offer:", error)
    
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при обновлении коммерческого предложения" },
      { status: 500 }
    )
  }
}
