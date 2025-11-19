// app/api/commercial-offers/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
  IMAGE_URL_MAX_LENGTH: 2000
} as const;

// Единый интерфейс данных
interface CommercialOfferData {
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
  description?: string;
  postToTelegram?: boolean;
  channelIds?: string[];
}

// Улучшенная валидация
class OfferValidator {
  static validateCreateData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Валидация названия
    if (!data.title || !data.title.trim()) {
      errors.push("Название техники обязательно для заполнения");
    } else if (data.title.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
      errors.push(`Название не может превышать ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} символов`);
    }

    // Валидация цены
    if (data.price === undefined || data.price === null) {
      errors.push("Цена обязательна для заполнения");
    } else if (typeof data.price !== 'number' || isNaN(data.price) || data.price < 0) {
      errors.push("Цена должна быть положительным числом");
    } else if (data.price > VALIDATION_LIMITS.PRICE_MAX) {
      errors.push(`Цена не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString('ru-RU')} руб.`);
    }

    // Валидация цены с НДС
    if (data.priceWithVat !== undefined && data.priceWithVat !== null) {
      if (typeof data.priceWithVat !== 'number' || isNaN(data.priceWithVat) || data.priceWithVat < 0) {
        errors.push("Цена с НДС должна быть положительным числом");
      } else if (data.priceWithVat > VALIDATION_LIMITS.PRICE_MAX) {
        errors.push(`Цена с НДС не может превышать ${VALIDATION_LIMITS.PRICE_MAX.toLocaleString('ru-RU')} руб.`);
      }
    }

    // Валидация URL изображения
    if (data.imageUrl && !this.isValidImageUrl(data.imageUrl)) {
      errors.push("Некорректный URL изображения");
    }

    // Валидация спецификаций
    if (data.specifications && typeof data.specifications !== 'object') {
      errors.push("Спецификации должны быть объектом");
    } else if (data.specifications && Object.keys(data.specifications).length > VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS) {
      errors.push(`Слишком много характеристик (максимум ${VALIDATION_LIMITS.SPECIFICATIONS_MAX_KEYS})`);
    }

    // Валидация каналов Telegram
    if (data.channelIds) {
      if (!Array.isArray(data.channelIds)) {
        errors.push("ChannelIds должен быть массивом");
      } else if (data.channelIds.length > VALIDATION_LIMITS.CHANNEL_IDS_MAX) {
        errors.push(`Слишком много каналов (максимум ${VALIDATION_LIMITS.CHANNEL_IDS_MAX})`);
      } else if (data.channelIds.some((id: any) => typeof id !== 'string' || !id.trim())) {
        errors.push("Все channelIds должны быть непустыми строками");
      }
    }

    // Валидация строковых полей
    const stringFields = [
      'availability', 'paymentType', 'lease', 'equipment', 'description'
    ] as const;
    
    stringFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null) {
        if (typeof data[field] !== 'string') {
          errors.push(`Поле ${field} должно быть строкой`);
        } else {
          const maxLength = field === 'description' 
            ? VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH 
            : VALIDATION_LIMITS.STRING_FIELD_MAX_LENGTH;
          
          if (data[field].length > maxLength) {
            errors.push(`Поле ${field} не может превышать ${maxLength} символов`);
          }
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  static isValidImageUrl(url: string): boolean {
    if (!url || url.length > VALIDATION_LIMITS.IMAGE_URL_MAX_LENGTH) return false;
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  static validateId(id: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 100;
  }
}

// Утилиты для работы с Supabase
class SupabaseUtils {
  static createClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Отсутствуют переменные окружения Supabase");
    }

    const cookieStore = cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Игнорируем запись кук
          }
        }
      }
    );
  }
}

// Сервис для работы с Telegram
class TelegramService {
  static async publishOffer(offerId: string, channelIds: string[], origin: string) {
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
      return result;

    } catch (error) {
      console.error('❌ Ошибка при публикации в Telegram:', error);
      // Не пробрасываем ошибку, чтобы не влиять на основной поток
    }
  }
}

// POST: Создание коммерческого предложения
export async function POST(request: NextRequest) {
  try {
    // Парсинг и валидация тела запроса
    const text = await request.text();
    if (!text.trim()) {
      return NextResponse.json(
        { error: "Тело запроса не может быть пустым" },
        { status: 400 }
      );
    }

    let body: CommercialOfferData;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Неверный формат JSON" },
        { status: 400 }
      );
    }

    // Валидация данных
    const validation = OfferValidator.validateCreateData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join("; ") },
        { status: 400 }
      );
    }

    // Создание клиента Supabase
    const supabase = SupabaseUtils.createClient();

    // Проверка дубликатов
    const { data: existing, error: checkError } = await supabase
      .from("commercial_offers")
      .select("id")
      .ilike("title", body.title.trim())
      .limit(1);

    if (checkError) throw checkError;
    if (existing?.length > 0) {
      return NextResponse.json(
        { error: "Коммерческое предложение с таким названием уже существует" },
        { status: 409 }
      );
    }

    // Подготовка данных для вставки
    const now = new Date().toISOString();
    const insertData = {
      title: body.title.trim(),
      description: body.description?.trim() || null,
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
        ? body.channelIds.filter((id: any) => typeof id === 'string' && id.trim())
            .slice(0, VALIDATION_LIMITS.CHANNEL_IDS_MAX)
        : [],
      telegram_posted: false,
      telegram_message_id: null
    };

    // Вставка данных
    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select(`
        id, title, description, price, price_with_vat, availability, 
        payment_type, vat_included, diagnostics_passed, image_url, 
        specifications, currency, equipment, lease, created_at, 
        updated_at, is_active, is_featured, post_to_telegram, 
        channel_ids, telegram_posted
      `)
      .single();

    if (error) {
      console.error("Ошибка вставки в Supabase:", error);
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "Предложение уже существует" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Ошибка базы данных" },
        { status: 500 }
      );
    }

    console.log(`✅ Создано коммерческое предложение: ${data.id} - ${data.title}`);

    // Асинхронная публикация в Telegram
    if (body.postToTelegram && body.channelIds?.length) {
      TelegramService.publishOffer(data.id, body.channelIds, request.nextUrl.origin);
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

// GET: Получение списка предложений
export async function GET(request: NextRequest) {
  try {
    const supabase = SupabaseUtils.createClient();
    const url = new URL(request.url);

    // Параметры пагинации
    const page = Math.max(1, Math.min(
      VALIDATION_LIMITS.PAGE_MAX, 
      parseInt(url.searchParams.get('page') || '1', 10)
    ));
    const limit = Math.max(1, Math.min(
      VALIDATION_LIMITS.LIMIT_MAX, 
      parseInt(url.searchParams.get('limit') || '10', 10)
    ));
    const offset = (page - 1) * limit;

    // Параметры фильтрации
    let search = url.searchParams.get('search')?.trim() || null;
    if (search && search.length > VALIDATION_LIMITS.SEARCH_MAX_LENGTH) {
      search = search.substring(0, VALIDATION_LIMITS.SEARCH_MAX_LENGTH);
    }

    const isActive = url.searchParams.get('is_active');
    const isFeatured = url.searchParams.get('is_featured');

    // Построение запроса
    let query = supabase
      .from("commercial_offers")
      .select(`
        id, title, description, price, price_with_vat, availability, 
        image_url, created_at, updated_at, telegram_posted, 
        is_active, is_featured, equipment, payment_type, lease,
        diagnostics_passed, vat_included
      `, { count: 'exact' });

    // Применение фильтров
    if (search) {
      query = query.or(`title.ilike.%${search}%,equipment.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (isFeatured !== null) {
      query = query.eq('is_featured', isFeatured === 'true');
    }

    // Выполнение запроса
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
        isActive: isActive || null,
        isFeatured: isFeatured || null
      }
    });

  } catch (error) {
    console.error("Ошибка получения списка предложений:", error);
    return NextResponse.json(
      { error: "Ошибка сервера при получении данных" },
      { status: 500 }
    );
  }
}
