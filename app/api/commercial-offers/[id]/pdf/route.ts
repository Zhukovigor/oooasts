import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// Улучшенная функция транслитерации
function transliterate(text: string): string {
  if (!text) return 'commercial-offer'
  
  const map: { [key: string]: string } = {
    // Строчные буквы
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 
    'я': 'ya',
    // Заглавные буквы
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 
    'Я': 'Ya'
  }
  
  return text
    .split('')
    .map(char => map[char] || (char.match(/[a-zA-Z0-9_-]/) ? char : '-'))
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 100)
}

// Улучшенная функция для форматирования даты
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    // Проверяем валидность даты
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return new Date().toLocaleDateString('ru-RU')
  }
}

// Улучшенная функция для обработки изображения
function handleImageError(imgUrl: string | null): string {
  if (!imgUrl) return ''
  
  try {
    const url = new URL(imgUrl)
    // Проверяем допустимые протоколы
    if (!['http:', 'https:'].includes(url.protocol)) {
      return ''
    }
    return imgUrl
  } catch {
    return ''
  }
}

// Функция для валидации ID
function validateOfferId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 100
}

// Функция для безопасного парсинга спецификаций
function safeParseSpecifications(specs: any): Record<string, string> {
  if (!specs || typeof specs !== 'object') {
    return {}
  }
  
  const result: Record<string, string> = {}
  
  try {
    Object.entries(specs).forEach(([key, value]) => {
      if (typeof key === 'string' && typeof value === 'string') {
        result[key] = value
      }
    })
  } catch (error) {
    console.error('Error parsing specifications:', error)
  }
  
  return result
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Валидация ID
    const offerId = params.id
    if (!offerId || !validateOfferId(offerId)) {
      return NextResponse.json(
        { error: "Некорректный ID коммерческого предложения" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    
    // Проверка переменных окружения
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: "Ошибка конфигурации сервера" },
        { status: 500 }
      )
    }

    const supabase = createServerClient(
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

    // Получаем данные предложения с таймаутом
    const { data, error } = await Promise.race([
      supabase
        .from("commercial_offers")
        .select("*")
        .eq("id", offerId)
        .single(),
      new Promise<{ data: null; error: any }>((resolve) => 
        setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 10000)
      )
    ]) as { data: any; error: any }

    if (error || !data) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: "Коммерческое предложение не найдено" },
        { status: 404 }
      )
    }

    // Подготавливаем данные
    const {
      title = "Коммерческое предложение",
      equipment,
      price,
      price_with_vat,
      availability,
      payment_type,
      lease,
      diagnostics_passed,
      image_url,
      specifications,
      created_at
    } = data

    // Безопасная обработка спецификаций
    const safeSpecifications = safeParseSpecifications(specifications)
    const specsEntries = Object.entries(safeSpecifications)
    const formattedDate = formatDate(created_at)
    const safeImageUrl = handleImageError(image_url)
    
    const htmlContent = generateHTMLContent({
      title,
      equipment,
      price,
      price_with_vat,
      availability,
      payment_type,
      lease,
      diagnostics_passed,
      image_url: safeImageUrl,
      specsEntries,
      formattedDate
    })

    const safeFilename = transliterate(title)

    // Определяем тип ответа на основе query параметров
    const url = new URL(request.url)
    const download = url.searchParams.get('download')
    const format = url.searchParams.get('format')

    const headers: Record<string, string> = {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, immutable"
    }

    if (download === 'true' || format === 'html') {
      headers["Content-Disposition"] = `attachment; filename="${safeFilename}.html"`
    } else {
      headers["Content-Disposition"] = `inline; filename="${safeFilename}.html"`
    }

    return new NextResponse(htmlContent, { headers })

  } catch (error) {
    console.error("Error generating offer HTML:", error)
    
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при генерации документа" }, 
      { status: 500 }
    )
  }
}

// Интерфейс для данных HTML контента
interface HTMLContentData {
  title: string;
  equipment?: string;
  price?: number;
  price_with_vat?: number;
  availability?: string;
  payment_type?: string;
  lease?: string;
  diagnostics_passed?: boolean;
  image_url?: string;
  specsEntries: [string, string][];
  formattedDate: string;
}

// Функция генерации HTML контента
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
  } = data

  // Форматируем цену
  const formattedPrice = price ? price.toLocaleString('ru-RU') : 'Цена не указана'
  const formattedPriceWithVat = price_with_vat ? price_with_vat.toLocaleString('ru-RU') : null

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
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
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
            position: relative;
        }
        
        /* Заголовок - по центру */
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
        
        .header .subtitle {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 6px;
            color: #333;
        }
        
        .header .model {
            font-size: 18px;
            font-weight: bold;
            color: #0066cc;
            margin-top: 5px;
        }
        
        /* Секция с фото и ценой - книжная раскладка */
        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
            align-items: start;
            min-height: 400px;
        }
        
        /* Левая колонка - фото */
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
            height: 100%;
            min-height: 300px;
        }
        
        .image-container img {
            max-width: 100%;
            max-height: 280px;
            height: auto;
            display: block;
            border-radius: 4px;
            object-fit: contain;
        }
        
        .no-image {
            color: #999;
            font-style: italic;
            font-size: 14px;
        }
        
        /* Правая колонка - цена и условия */
        .price-box {
            background: #ffffff;
            color: #000000;
            padding: 25px 20px;
            border-radius: 6px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 2px solid #e0e0e0;
            min-height: 300px;
        }
        
        .price-label {
            font-size: 14px;
            margin-bottom: 12px;
            font-weight: bold;
            color: #000000;
        }
        
        .price-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 12px;
            color: #000000;
        }
        
        .price-details {
            margin-bottom: 20px;
        }
        
        .price-detail-item {
            font-size: 13px;
            margin-bottom: 6px;
            color: #000000;
        }
        
        .conditions {
            font-size: 13px;
            line-height: 1.6;
            color: #000000;
        }
        
        .condition-item {
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
            color: #000000;
        }
        
        .condition-item:before {
            content: '•';
            position: absolute;
            left: 0;
            font-weight: bold;
            color: #000000;
            font-size: 14px;
        }
        
        /* Таблица характеристик */
        .specs-section {
            margin-top: 30px;
        }
        
        .specs-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            color: #000;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 8px;
        }
        
        .specs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            border: 1px solid #ddd;
        }
        
        .specs-table tr {
            border-bottom: 1px solid #ddd;
        }
        
        .specs-table tr:nth-child(even) {
            background-color: #fafafa;
        }
        
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
        
        .specs-table td:last-child {
            width: 60%;
            color: #333;
        }
        
        /* Футер */
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 11px;
        }
        
        .footer-info {
            margin-top: 8px;
            font-size: 10px;
            color: #999;
        }
        
        /* Стили для печати в книжной ориентации */
        @media print {
            @page {
                size: A4 portrait;
                margin: 1cm;
            }
            
            body {
                background: white;
                margin: 0;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                margin: 0;
                padding: 0;
                min-height: auto;
                max-width: none;
            }
            
            .main-content {
                page-break-inside: avoid;
            }
            
            .specs-section {
                page-break-inside: avoid;
            }
            
            .image-container img {
                max-height: 250px;
            }
        }
        
        /* Адаптивность для мобильных */
        @media (max-width: 600px) {
            .container {
                padding: 20px 15px;
                margin: 10px;
            }
            
            .main-content {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .price-value {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Заголовок - по центру -->
        <div class="header">
            <h1>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
            ${equipment ? `<div class="subtitle">${escapeHtml(equipment)}</div>` : ''}
            <div class="model">${escapeHtml(title)}</div>
        </div>
        
        <!-- Основной контент: фото слева, цена справа - книжная раскладка -->
        <div class="main-content">
            <!-- Левая колонка - фото -->
            <div class="image-container">
                ${image_url ? `
                <img src="${escapeHtml(image_url)}" alt="${escapeHtml(title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <div class="no-image" style="display: none;">Изображение не доступно</div>
                ` : '<div class="no-image">Изображение не предоставлено</div>'}
            </div>
            
            <!-- Правая колонка - цена и условия -->
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
        
        <!-- Таблица технических характеристик -->
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
        
        <!-- Футер -->
        <div class="footer">
            <div>Коммерческое предложение сформировано автоматически</div>
            <div class="footer-info">Дата создания: ${escapeHtml(formattedDate)}</div>
        </div>
    </div>
</body>
</html>
`
}

// Функция для экранирования HTML
function escapeHtml(unsafe: string): string {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
