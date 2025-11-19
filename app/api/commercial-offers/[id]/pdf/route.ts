import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Улучшенная функция транслитерации
function transliterate(text: string): string {
  if (!text) return 'commercial-offer';
  
  const map: { [key: string]: string } = {
    // Строчные
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    // Заглавные
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text
    .split('')
    .map(char => map[char] || (char.match(/[a-zA-Z0-9_-]/) ? char : '-'))
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 100) || 'commercial-offer';
}

// Форматирование даты
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return new Date().toLocaleDateString('ru-RU');
  }
}

// Безопасная обработка URL изображения
function handleImageError(imgUrl: string | null): string {
  if (!imgUrl) return '';
  try {
    const url = new URL(imgUrl);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return imgUrl;
  } catch {
    return '';
  }
}

// Валидация ID
function validateOfferId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 100;
}

// Безопасный парсинг спецификаций
function safeParseSpecifications(specs: any): Record<string, string> {
  if (!specs || typeof specs !== 'object') return {};
  const result: Record<string, string> = {};
  try {
    Object.entries(specs).forEach(([key, value]) => {
      if (typeof key === 'string' && typeof value === 'string') {
        result[key] = value;
      }
    });
  } catch (error) {
    console.error('Ошибка парсинга спецификаций:', error);
  }
  return result;
}

// Безопасное экранирование HTML (поддерживает null/undefined)
function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Интерфейс данных для HTML
interface HTMLContentData {
  title: string;
  equipment?: string | null;
  price?: number | null;
  price_with_vat?: number | null;
  availability?: string | null;
  payment_type?: string | null;
  lease?: string | null;
  diagnostics_passed?: boolean | null;
  image_url?: string | null;
  specsEntries: [string, string][];
  formattedDate: string;
}

// Генерация HTML
function generateHTMLContent(data: HTMLContentData): string {
  const {
    title,
    equipment,
    price,
    price_with_vat,
    availability,
    payment_type,
    lease,
    diagnostics_passed,
    image_url,
    specsEntries,
    formattedDate
  } = data;

  const formattedPrice = price ? price.toLocaleString('ru-RU') : 'Цена не указана';
  const formattedPriceWithVat = price_with_vat ? price_with_vat.toLocaleString('ru-RU') : null;

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} - Коммерческое предложение</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, Helvetica, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            padding: 40px 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            min-height: 1122px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 15px;
        }
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
            color: #000;
            letter-spacing: 1px;
        }
        .header .subtitle,
        .header .model {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        .header .model {
            color: #0066cc;
            margin-top: 5px;
            font-size: 18px;
        }
        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
            align-items: start;
            min-height: 400px;
        }
        .image-container {
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
            background: #f8f8f8;
            padding: 15px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
        }
        .image-container img {
            max-width: 100%;
            max-height: 280px;
            height: auto;
            object-fit: contain;
            border-radius: 4px;
        }
        .no-image {
            color: #999;
            font-style: italic;
            font-size: 14px;
        }
        .price-box {
            background: white;
            padding: 25px 20px;
            border-radius: 6px;
            border: 2px solid #e0e0e0;
            min-height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .price-label {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 12px;
        }
        .price-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 12px;
        }
        .price-detail-item {
            font-size: 13px;
            margin-bottom: 6px;
        }
        .conditions { font-size: 13px; line-height: 1.6; }
        .condition-item {
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
        }
        .condition-item:before {
            content: '•';
            position: absolute;
            left: 0;
            font-weight: bold;
            color: #000;
        }
        .specs-section {
            margin-top: 30px;
        }
        .specs-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 8px;
        }
        .specs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            border: 1px solid #ddd;
        }
        .specs-table tr { border-bottom: 1px solid #ddd; }
        .specs-table tr:nth-child(even) { background-color: #fafafa; }
        .specs-table td {
            padding: 10px 12px;
            vertical-align: top;
        }
        .specs-table td:first-child {
            width: 40%;
            font-weight: bold;
            color: #555;
            border-right: 1px solid #ddd;
            background-color: #f9f9f9;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 11px;
        }
        .footer-info { margin-top: 8px; font-size: 10px; color: #999; }
        @media print {
            @page { size: A4 portrait; margin: 1cm; }
            body { background: white; margin: 0; padding: 0; }
            .container { box-shadow: none; margin: 0; padding: 0; max-width: none; }
        }
        @media (max-width: 600px) {
            .container { padding: 20px 15px; margin: 10px; }
            .main-content { grid-template-columns: 1fr; gap: 20px; }
            .price-value { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
            ${equipment ? `<div class="subtitle">${escapeHtml(equipment)}</div>` : ''}
            <div class="model">${escapeHtml(title)}</div>
        </div>

        <div class="main-content">
            <div class="image-container">
                ${image_url ? `
                <img src="${escapeHtml(image_url)}" alt="${escapeHtml(title)}" 
                     onerror="this.parentElement.innerHTML='<div class=\\\"no-image\\\">Изображение недоступно</div>';" />
                ` : '<div class="no-image">Изображение не предоставлено</div>'}
            </div>

            <div class="price-box">
                <div>
                    <div class="price-label">Стоимость техники:</div>
                    <div class="price-value">${formattedPrice} руб.</div>
                    <div class="price-details">
                        ${formattedPriceWithVat ? `<div class="price-detail-item">Стоимость с НДС: ${formattedPriceWithVat} руб.</div>` : ''}
                        ${availability ? `<div class="price-detail-item">${escapeHtml(availability)}</div>` : ''}
                    </div>
                </div>
                <div class="conditions">
                    ${lease ? `<div class="condition-item">${escapeHtml(lease)}</div>` : ''}
                    ${payment_type ? `<div class="condition-item">${escapeHtml(payment_type)}</div>` : ''}
                    ${diagnostics_passed ? `<div class="condition-item">Диагностика пройдена</div>` : ''}
                </div>
            </div>
        </div>

        ${specsEntries.length > 0 ? `
        <div class="specs-section">
            <div class="specs-title">Технические характеристики</div>
            <table class="specs-table">
                <tbody>
                    ${specsEntries.map(([key, value]) => `
                    <tr>
                        <td>${escapeHtml(key)}</td>
                        <td>${escapeHtml(value)}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}

        <div class="footer">
            <div>Коммерческое предложение сформировано автоматически</div>
            <div class="footer-info">Дата создания: ${escapeHtml(formattedDate)}</div>
        </div>
    </div>
</body>
</html>
`;
}

// Основной обработчик GET
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = params.id;
    if (!offerId || !validateOfferId(offerId)) {
      return NextResponse.json(
        { error: "Некорректный ID коммерческого предложения" },
        { status: 400 }
      );
    }

    // Проверка переменных окружения
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Отсутствуют переменные окружения Supabase');
      return NextResponse.json(
        { error: "Ошибка конфигурации сервера" },
        { status: 500 }
      );
    }

    // Создание клиента (только чтение — запись кук не нужна)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Игнорируем — не используем аутентификацию через куки
          },
        },
      }
    );

    // Получение данных (без таймаута через Promise.race)
    const { data, error } = await supabase
      .from("commercial_offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (error || !data) {
      console.error('Ошибка Supabase:', error?.message || 'Данные не найдены');
      return NextResponse.json(
        { error: "Коммерческое предложение не найдено" },
        { status: 404 }
      );
    }

    // Подготовка данных
    const safeSpecifications = safeParseSpecifications(data.specifications);
    const specsEntries = Object.entries(safeSpecifications);
    const formattedDate = formatDate(data.created_at);
    const safeImageUrl = handleImageError(data.image_url);

    const htmlContent = generateHTMLContent({
      title: data.title || "Коммерческое предложение",
      equipment: data.equipment,
      price: data.price,
      price_with_vat: data.price_with_vat,
      availability: data.availability,
      payment_type: data.payment_type,
      lease: data.lease,
      diagnostics_passed: data.diagnostics_passed,
      image_url: safeImageUrl,
      specsEntries,
      formattedDate,
    });

    const safeFilename = transliterate(data.title || "commercial-offer");

    // Определение режима ответа
    const url = new URL(request.url);
    const download = url.searchParams.get('download') === 'true';
    const format = url.searchParams.get('format');

    const headers: Record<string, string> = {
      "Content-Type": "text/html; charset=utf-8",
      // Кеширование 5 минут — достаточно для публичного документа
      "Cache-Control": "public, max-age=300"
    };

    if (download || format === 'html') {
      headers["Content-Disposition"] = `attachment; filename="${safeFilename}.html"`;
    } else {
      headers["Content-Disposition"] = `inline; filename="${safeFilename}.html"`;
    }

    return new NextResponse(htmlContent, { headers });

  } catch (error) {
    console.error("Критическая ошибка при генерации HTML:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
