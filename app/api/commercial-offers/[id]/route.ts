import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Интерфейс для данных создания предложения
interface CreateOfferData {
  title: string;
  price: number;
  priceWithVat?: number;
  availability?: string;
  paymentType?: string;
  lease?: string;
  vatIncluded?: boolean;
  diagnosticsPassed?: boolean;
  imageUrl?: string;
  specifications?: Record<string, string>;
  equipment?: string;
  postToTelegram?: boolean;
  channelIds?: string[];
}

// Константы для валидации
const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  PRICE_MAX: 1000000000,
  SPECIFICATIONS_MAX_KEYS: 50,
  CHANNEL_IDS_MAX: 10,
  SEARCH_MAX_LENGTH: 100,
  PAGE_MAX: 1000,
  LIMIT_MAX: 100
} as const;

// Валидация данных создания
function validateCreateData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || !data.title.trim()) {
    errors.push("Название техники обязательно для заполнения");
  } else if (data.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
    errors.push(`Название не может превышать ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} символов`);
  }

  if (data.price === undefined || data.price === null) {
    errors.push("Цена обязательна для заполнения");
  } else if (typeof data.price !== 'number' || isNaN(data.price) || data.price < 0) {
    errors.push("Цена должна быть положительным числом");
  } else if (data.price > VALIDATION_LIMITS.PRICE_MAX) {
    errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString('ru-RU')} руб.`);
  }

  if (data.priceWithVat !== undefined && data.priceWithVat !== null) {
    if (typeof data.priceWithVat !== 'number' || isNaN(data.priceWithVat) || data.priceWithVat < 0) {
      errors.push("Цена с НДС должна быть положительным числом");
    } else if (data.priceWithVat > VALIDATION_LIMITS.PRICE_MAX) {
      errors.push(`Цена с НДС не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString('ru-RU')} руб.`);
    }
  }

  if (data.imageUrl && !isValidImageUrl(data.imageUrl)) {
    errors.push("Некорректный URL изображения");
  }

  if (data.specifications && typeof data.specifications !== 'object') {
    errors.push("Спецификации должны быть объектом");
  } else if (data.specifications && Object.keys(data.specifications).length > VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS) {
    errors.push(`Слишком много характеристик (максимум ${VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS})`);
  }

  if (data.channelIds) {
    if (!Array.isArray(data.channelIds)) {
      errors.push("ChannelIds должен быть массивом");
    } else if (data.channelIds.length > VALIDATION_LIMITS.CHANNEL_IDS_MAX) {
      errors.push(`Слишком много каналов (максимум ${VALIDATION_LIMITS.CHANNEL_IDS_MAX})`);
    } else if (data.channelIds.some((id: any) => typeof id !== 'string' || !id.trim())) {
      errors.push("Все channelIds должны быть непустыми строками");
    }
  }

  const stringFields = ['availability', 'paymentType', 'lease', 'equipment'] as const;
  stringFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && typeof data[field] !== 'string') {
      errors.push(`Поле ${field} должно быть строкой`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Безопасное создание клиента Supabase (только для чтения кук)
function createSupabaseClientForServer() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Отсутствуют переменные окружения Supabase");
  }

  const cookieStore = cookies(); // Доступно только внутри обработчиков (GET/POST)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // НЕ записываем куки — не нужно при использовании service role key
        setAll() {}
      }
    }
  );
}

// Улучшенная валидация URL изображения (разрешает внешние домены)
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Асинхронная публикация в Telegram (без доступа к cookies!)
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
    console.log(`✅ Успешная публикация в Telegram для предложения ${offerId}`);

    // Опционально: обновление статуса через отдельный серверный вызов (без SSR-клиента)
    // Можно реализовать через внутренний API или оставить как есть

  } catch (error) {
    console.error('❌ Ошибка публикации в Telegram:', error);
    // Не пробрасываем ошибку — не блокируем основной ответ
  }
}

// === POST: Создание предложения ===
export async function POST(request: NextRequest) {
  try {
    // 1. Парсинг тела
    const text = await request.text();
    if (!text.trim()) {
      return NextResponse.json({ error: "Тело запроса не может быть пустым" }, { status: 400 });
    }
    let body: CreateOfferData;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Неверный формат JSON" }, { status: 400 });
    }

    // 2. Валидация
    const validation = validateCreateData(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join("; ") }, { status: 400 });
    }

    // 3. Инициализация Supabase (только внутри обработчика!)
    const supabase = createSupabaseClientForServer();

    // 4. Проверка дубликатов
    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .ilike("title", body.title.trim())
      .limit(1);

    if (checkError) throw checkError;
    if (existing?.length) {
      return NextResponse.json({ error: "Предложение с таким названием уже существует" }, { status: 409 });
    }

    // 5. Вставка
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
      is_featured: false,
      post_to_telegram: Boolean(body.postToTelegram),
      channel_ids: Array.isArray(body.channelIds)
        ? body.channelIds.filter(id => typeof id === 'string' && id.trim()).slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX)
        : [],
      telegram_posted: false,
      telegram_message_id: null
    };

    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select(`
        id, title, price, price_with_vat, availability, payment_type,
        vat_included, diagnostics_passed, image_url, specifications,
        currency, equipment, lease, created_at, updated_at, is_active,
        is_featured, post_to_telegram, channel_ids, telegram_posted
      `)
      .single();

    if (error) {
      console.error("Ошибка вставки в Supabase:", error);
      if (error.code === '23505') {
        return NextResponse.json({ error: "Предложение уже существует" }, { status: 409 });
      }
      return NextResponse.json({ error: "Ошибка базы данных" }, { status: 500 });
    }

    // 6. Асинхронная публикация в Telegram
    if (body.postToTelegram && body.channelIds?.length) {
      publishToTelegram(data.id, body.channelIds, request.nextUrl.origin);
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Коммерческое предложение успешно создано",
      id: data.id
    }, { status: 201 });

  } catch (error: any) {
    console.error("Критическая ошибка при создании предложения:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// === GET: Список предложений ===
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClientForServer();
    const url = new URL(request.url);

    const page = Math.max(1, Math.min(VALIDATION_LIMITS.PAGE_MAX, parseInt(url.searchParams.get('page') || '1', 10)));
    const limit = Math.max(1, Math.min(VALIDATION_LIMITS.LIMIT_MAX, parseInt(url.searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;
    let search = url.searchParams.get('search')?.trim() || null;
    if (search && search.length > VALIDATION_LIMITS.SEARCH_MAX_LENGTH) {
      search = search.substring(0, VALIDATION_LIMITS.SEARCH_MAX_LENGTH);
    }

    const isActive = url.searchParams.get('is_active');
    const isFeatured = url.searchParams.get('is_featured');

    let query = supabase
      .from("commercial_offers")
      .select(`
        id, title, price, price_with_vat, availability, image_url,
        created_at, updated_at, telegram_posted, is_active, is_featured, equipment
      `, { count: 'exact' });

    if (search) {
      query = query.or(`title.ilike.%${search}%,equipment.ilike.%${search}%`);
    }
    if (isActive !== null) query = query.eq('is_active', isActive === 'true');
    if (isFeatured !== null) query = query.eq('is_featured', isFeatured === 'true');

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
      filters: { search, isActive, isFeatured }
    });

  } catch (error) {
    console.error("Ошибка получения списка предложений:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при получении данных" },
      { status: 500 }
    );
  }
}
