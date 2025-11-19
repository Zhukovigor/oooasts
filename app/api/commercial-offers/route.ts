import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Константы для валидации
const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  PRICE_MAX: 1000000000,
  SPECIFICATIONS_MAX_KEYS: 50,
  CHANNEL_IDS_MAX: 10,
  PAGE_MAX: 1000,
  LIMIT_MAX: 100,
  STRING_FIELD_MAX_LENGTH: 500
} as const;

// Валидация данных создания
function validateCreateData(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.title || !body.title.trim()) {
    errors.push("Название техники обязательно для заполнения");
  } else if (body.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
    errors.push(`Название не может превышать ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} символов`);
  }

  if (body.price === undefined || body.price === null) {
    errors.push("Цена обязательна для заполнения");
  } else if (typeof body.price !== 'number' || isNaN(body.price) || body.price < 0) {
    errors.push("Цена должна быть положительным числом");
  } else if (body.price > VALIDATION_LIMITS.PRICE_MAX) {
    errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString('ru-RU')} руб.`);
  }

  if (body.priceWithVat !== undefined && body.priceWithVat !== null) {
    if (typeof body.priceWithVat !== 'number' || isNaN(body.priceWithVat) || body.priceWithVat < 0) {
      errors.push("Цена с НДС должна быть положительным числом");
    } else if (body.priceWithVat > VALIDATION_LIMITS.PRICE_MAX) {
      errors.push(`Цена с НДС не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString('ru-RU')} руб.`);
    }
  }

  if (body.imageUrl && !isValidImageUrl(body.imageUrl)) {
    errors.push("Некорректный URL изображения");
  }

  if (body.specifications && typeof body.specifications !== 'object') {
    errors.push("Спецификации должны быть объектом");
  } else if (body.specifications && Object.keys(body.specifications).length > VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS) {
    errors.push(`Слишком много характеристик (максимум ${VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS})`);
  }

  if (body.channelIds) {
    if (!Array.isArray(body.channelIds)) {
      errors.push("ChannelIds должен быть массивом");
    } else if (body.channelIds.length > VALIDATION_LIMITS.CHANNEL_IDS_MAX) {
      errors.push(`Слишком много каналов (максимум ${VALIDATION_LIMITS.CHANNEL_IDS_MAX})`);
    } else if (body.channelIds.some((id: any) => typeof id !== 'string' || !id.trim())) {
      errors.push("Все channelIds должны быть непустыми строками");
    }
  }

  const stringFields = ['availability', 'paymentType', 'lease', 'equipment'] as const;
  stringFields.forEach(field => {
    if (body[field] !== undefined && body[field] !== null) {
      if (typeof body[field] !== 'string') {
        errors.push(`Поле ${field} должно быть строкой`);
      } else if (body[field].length > VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH) {
        errors.push(`Поле ${field} не может превышать ${VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH} символов`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Упрощённая и корректная валидация URL изображения
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Создание Supabase клиента — вызывается ТОЛЬКО внутри POST/GET
function createSupabaseClient() {
  const cookieStore = cookies(); // ✅ допустимо внутри обработчика

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Отсутствуют переменные окружения Supabase");
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Игнорируем запись кук — не нужна при использовании service role key
        }
      }
    }
  );
}

// Фоновая публикация в Telegram (БЕЗ доступа к Supabase!)
async function publishToTelegram(offerId: string, channelIds: string[], origin: string) {
  try {
    const response = await fetch(`${origin}/api/telegram/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId,
        channelIds: channelIds.slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX)
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Telegram API error (${response.status}): ${text}`);
    }

    const result = await response.json();
    console.log(`✅ Telegram: предложение ${offerId} успешно опубликовано`);
    return result;

  } catch (error) {
    console.error('❌ Ошибка при публикации в Telegram:', error);
    // Ошибка не пробрасывается — основной ответ уже отправлен
  }
}

// === POST: Создание коммерческого предложения ===
export async function POST(request: NextRequest) {
  let supabase;
  try {
    supabase = createSupabaseClient(); // ✅ Вызывается внутри обработчика
  } catch (error) {
    console.error("Ошибка инициализации Supabase:", error);
    return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 });
  }

  // Парсинг тела запроса
  let body: any;
  try {
    const text = await request.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "Тело запроса не может быть пустым" }, { status: 400 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Неверный формат JSON" }, { status: 400 });
  }

  // Валидация
  const validation = validateCreateData(body);
  if (!validation.isValid) {
    return NextResponse.json({ error: validation.errors.join("; ") }, { status: 400 });
  }

  try {
    // Проверка дубликатов
    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .ilike("title", body.title.trim())
      .limit(1);

    if (checkError) throw checkError;
    if (existing?.length > 0) {
      return NextResponse.json({ error: "Коммерческое предложение с таким названием уже существует" }, { status: 409 });
    }

    // Подготовка данных
    const now = new Date().toISOString();
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
      channel_ids: Array.isArray(body.channelIds)
        ? body.channelIds.filter((id: any) => typeof id === 'string' && id.trim()).slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX)
        : [],
      telegram_posted: false,
      telegram_message_id: null
    };

    // Вставка
    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select(`
        id, title, price, price_with_vat, availability, payment_type,
        vat_included, diagnostics_passed, image_url, specifications,
        currency, equipment, lease, created_at, updated_at,
        post_to_telegram, channel_ids, telegram_posted
      `)
      .single();

    if (error) {
      console.error("Ошибка вставки в Supabase:", error);
      if (error.code === '23505') {
        return NextResponse.json({ error: "Предложение уже существует" }, { status: 409 });
      }
      return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 });
    }

    console.log(`✅ Создано коммерческое предложение: ${data.id} - ${data.title}`);

    // Асинхронная публикация в Telegram (НЕ БЛОКИРУЕТ ответ)
    if (body.postToTelegram && body.channelIds?.length) {
      // Используем микрозадачу — выполняется после отправки ответа
      queueMicrotask(() => {
        publishToTelegram(data.id, body.channelIds, request.nextUrl.origin);
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Коммерческое предложение успешно создано",
      id: data.id
    }, { status: 201 });

  } catch (error: any) {
    console.error("Критическая ошибка при создании предложения:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

// === GET: Получение списка предложений ===
export async function GET(request: NextRequest) {
  let supabase;
  try {
    supabase = createSupabaseClient(); // ✅ внутри обработчика
  } catch (error) {
    return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Math.min(VALIDATION_LIMITS.PAGE_MAX, parseInt(url.searchParams.get('page') || '1', 10)));
    const limit = Math.max(1, Math.min(VALIDATION_LIMITS.LIMIT_MAX, parseInt(url.searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    let search = url.searchParams.get('search')?.trim() || null;
    if (search && search.length > VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH) {
      search = search.substring(0, VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH);
    }

    const isActive = url.searchParams.get('is_active');

    let query = supabase
      .from("commercial_offers")
      .select(`
        id, title, price, price_with_vat, availability, image_url,
        created_at, updated_at, telegram_posted, is_active, equipment
      `, { count: 'exact' })
      .eq('is_active', true); // по умолчанию — только активные

    if (search) {
      query = query.or(`title.ilike.%${search}%,equipment.ilike.%${search}%`);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

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
        search,
        isActive: isActive || null
      }
    });

  } catch (error) {
    console.error("Ошибка получения списка предложений:", error);
    return NextResponse.json({ error: "Ошибка сервера при получении данных" }, { status: 500 });
  }
}
