// app/api/commercial-offers/[id]/pdf/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

// Улучшенная функция транслитерации
function transliterate(text: string): string {
  if (!text) return 'commercial-offer';
  
  const map: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
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

// Безопасное экранирование HTML
function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
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

// Генерация HTML контента для PDF
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
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
        }
        body {
            background-color: #ffffff;
            color: #000000;
            line-height: 1.4;
            font-size: 12px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .container {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 15mm;
            position: relative;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1.5px solid #0066cc;
            padding-bottom: 12px;
        }
        .header h1 {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 8px;
            color: #000000;
            letter-spacing: 0.5px;
        }
        .header .subtitle {
            font-size: 14px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 5px;
        }
        .header .model {
            font-size: 16px;
            font-weight: bold;
            color: #0066cc;
        }
        .main-content {
            display: flex;
            gap: 20px;
            margin-bottom: 25px;
            min-height: 120mm;
        }
        .image-section {
            flex: 1;
            min-height: 120mm;
        }
        .details-section {
            flex: 1;
            min-height: 120mm;
            display: flex;
            flex-direction: column;
        }
        .image-container {
            border: 1px solid #cccccc;
            border-radius: 4px;
            overflow: hidden;
            background: #f8f8f8;
            padding: 10px;
            text-align: center;
            height: 120mm;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .image-container img {
            max-width: 100%;
            max-height: 115mm;
            height: auto;
            object-fit: contain;
        }
        .no-image {
            color: #666666;
            font-style: italic;
            font-size: 12px;
        }
        .price-box {
            border: 1px solid #cccccc;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
            background: #ffffff;
        }
        .price-label {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #000000;
        }
        .price-value {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #0066cc;
        }
        .price-detail-item {
            font-size: 11px;
            margin-bottom: 4px;
            color: #333333;
        }
        .conditions-box {
            border: 1px solid #cccccc;
            border-radius: 4px;
            padding: 15px;
            flex-grow: 1;
            background: #ffffff;
        }
        .conditions-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #000000;
        }
        .conditions {
            font-size: 11px;
        }
        .condition-item {
            margin-bottom: 6px;
            padding-left: 12px;
            position: relative;
            color: #333333;
        }
        .condition-item:before {
            content: '•';
            position: absolute;
            left: 0;
            font-weight: bold;
            color: #000000;
        }
        .specs-section {
            margin-top: 20px;
        }
        .specs-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 12px;
            text-align: center;
            border-bottom: 1.5px solid #0066cc;
            padding-bottom: 6px;
            color: #000000;
        }
        .specs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            border: 1px solid #cccccc;
        }
        .specs-table tr {
            border-bottom: 1px solid #dddddd;
        }
        .specs-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .specs-table td {
            padding: 8px 10px;
            vertical-align: top;
            border-right: 1px solid #dddddd;
        }
        .specs-table td:first-child {
            width: 40%;
            font-weight: bold;
            color: #333333;
            background-color: #f5f5f5;
        }
        .specs-table td:last-child {
            border-right: none;
        }
        .footer {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #cccccc;
            text-align: center;
            color: #666666;
            font-size: 10px;
            position: absolute;
            bottom: 15mm;
            left: 15mm;
            right: 15mm;
        }
        .footer-info {
            margin-top: 5px;
            font-size: 9px;
            color: #999999;
        }
        
        /* Print-specific styles */
        @media print {
            body {
                margin: 0;
                padding: 0;
                background: white;
            }
            .container {
                margin: 0;
                padding: 15mm;
                box-shadow: none;
                min-height: 297mm;
                page-break-after: always;
            }
            .main-content {
                page-break-inside: avoid;
            }
            .specs-section {
                page-break-inside: avoid;
            }
        }
        
        /* Fallback fonts for better PDF rendering */
        @font-face {
            font-family: 'DejaVu Sans';
            src: local('DejaVu Sans'), local('Arial');
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
            <div class="image-section">
                <div class="image-container">
                    ${image_url ? `
                    <img src="${escapeHtml(image_url)}" alt="${escapeHtml(title)}" 
                         onerror="this.parentElement.innerHTML='<div class=\"no-image\">Изображение недоступно</div>';" />
                    ` : '<div class="no-image">Изображение не предоставлено</div>'}
                </div>
            </div>
            
            <div class="details-section">
                <div class="price-box">
                    <div class="price-label">Стоимость техники:</div>
                    <div class="price-value">${formattedPrice} руб.</div>
                    <div class="price-details">
                        ${formattedPriceWithVat ? `<div class="price-detail-item">Стоимость с НДС: ${formattedPriceWithVat} руб.</div>` : ''}
                        ${availability ? `<div class="price-detail-item">${escapeHtml(availability)}</div>` : ''}
                    </div>
                </div>
                
                <div class="conditions-box">
                    <div class="conditions-title">Условия поставки и оплаты:</div>
                    <div class="conditions">
                        ${lease ? `<div class="condition-item">${escapeHtml(lease)}</div>` : ''}
                        ${payment_type ? `<div class="condition-item">${escapeHtml(payment_type)}</div>` : ''}
                        ${diagnostics_passed ? `<div class="condition-item">Диагностика пройдена</div>` : ''}
                        <div class="condition-item">Гарантийное обслуживание согласно условиям договора</div>
                        <div class="condition-item">Доставка по согласованию с менеджером</div>
                    </div>
                </div>
            </div>
        </div>

        ${specsEntries.length > 0 ? `
        <div class="specs-section">
            <div class="specs-title">ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ</div>
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
            <div>Коммерческое предложение сформировано автоматически и действительно в течение 30 дней</div>
            <div class="footer-info">Дата создания: ${escapeHtml(formattedDate)} | ID: ${data.id}</div>
        </div>
    </div>
</body>
</html>
`;
}

// Создание Supabase клиента
function createSupabaseClient() {
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
        },
      },
    }
  );
}

// Получение браузера для рендеринга PDF
async function getBrowser() {
  if (process.env.NODE_ENV === 'production') {
    // В продакшене используем Chromium
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // В разработке используем локальный Chrome
    return await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
}

// Основной обработчик GET для генерации PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let browser = null;
  
  try {
    const offerId = params.id;
    
    // Валидация ID
    if (!offerId || !validateOfferId(offerId)) {
      return NextResponse.json(
        { error: "Некорректный ID коммерческого предложения" },
        { status: 400 }
      );
    }

    // Получение данных предложения
    const supabase = createSupabaseClient();
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

    // Подготовка данных для HTML
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

    // Генерация PDF
    browser = await getBrowser();
    const page = await browser.newPage();
    
    // Установка контента и ожидание загрузки ресурсов
    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'load', 'domcontentloaded']
    });

    // Дополнительное ожидание для изображений
    await page.waitForTimeout(2000);

    // Генерация PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    });

    await browser.close();

    // Подготовка имени файла
    const safeFilename = transliterate(data.title || "commercial-offer");
    
    // Возврат PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeFilename}.pdf"`,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    // Закрытие браузера в случае ошибки
    if (browser) {
      await browser.close();
    }
    
    console.error("Критическая ошибка при генерации PDF:", error);
    
    return NextResponse.json(
      { 
        error: "Ошибка при генерации PDF",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Опционально: POST метод для генерации PDF с кастомными параметрами
export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const { download = false, format = 'pdf' } = body;

    // Редирект на GET с параметрами
    const url = new URL(request.url);
    url.searchParams.set('download', download.toString());
    url.searchParams.set('format', format);

    return NextResponse.redirect(url.toString(), 307);

  } catch (error) {
    console.error("Ошибка в POST обработчике PDF:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
