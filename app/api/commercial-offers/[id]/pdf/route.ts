import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

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
      .select("*")
      .eq("id", params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    const specsEntries = data.specifications ? Object.entries(data.specifications) : []
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - Коммерческое предложение</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            padding: 40px 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            min-height: 1122px;
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
        }
        
        .image-container img {
            max-width: 100%;
            max-height: 300px;
            height: auto;
            display: block;
            border-radius: 4px;
            object-fit: contain;
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
        }
        
        .specs-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        
        .specs-table tr {
            border-bottom: 1px solid #ddd;
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
                padding: 1.5cm;
                min-height: auto;
                max-width: none;
            }
            
            .main-content {
                page-break-inside: avoid;
            }
            
            .specs-section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Заголовок - по центру -->
        <div class="header">
            <h1>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
            <div class="subtitle">СЕДЕЛЬНЫЙ ТЯГАЧ</div>
            <div class="model">${data.title || 'VOLVO FH 460'}</div>
        </div>
        
        <!-- Основной контент: фото слева, цена справа - книжная раскладка -->
        <div class="main-content">
            <!-- Левая колонка - фото -->
            ${data.image_url ? `
            <div class="image-container">
                <img src="${data.image_url}" alt="${data.title || 'Техника'}" onerror="this.style.display='none'" />
            </div>
            ` : '<div class="image-container"></div>'}
            
            <!-- Правая колонка - цена и условия -->
            <div class="price-box">
                <div>
                    <div class="price-label">Стоимость техники:</div>
                    <div class="price-value">${data.price ? data.price.toLocaleString('ru-RU') : 'Цена не указана'} руб.</div>
                    <div class="price-details">
                        ${data.price_with_vat ? `<div class="price-detail-item">Стоимость с НДС.</div>` : ''}
                        ${data.availability ? `<div class="price-detail-item">В наличии.</div>` : ''}
                    </div>
                </div>
                <div class="conditions">
                    ${data.lease ? `<div class="condition-item">Продажа в лизинг.</div>` : ''}
                    ${data.payment_type ? `<div class="condition-item">${data.payment_type}.</div>` : ''}
                    ${data.diagnostics_passed ? `<div class="condition-item">Диагностика пройдена.</div>` : ''}
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
                        <td>${key}</td>
                        <td>${value}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
    </div>
</body>
</html>
`

    const safeFilename = transliterate(data.title || 'commercial-offer')

    // Определяем тип ответа на основе query параметров
    const url = new URL(request.url)
    const download = url.searchParams.get('download')
    const format = url.searchParams.get('format')

    const headers: Record<string, string> = {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600"
    }

    if (download === 'true' || format === 'html') {
        headers["Content-Disposition"] = `attachment; filename="${safeFilename}.html"`
    } else {
        headers["Content-Disposition"] = `inline; filename="${safeFilename}.html"`
    }

    return new NextResponse(htmlContent, { headers })

  } catch (error) {
    console.error("Error generating offer HTML:", error)
    
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Коммерческое предложение не найдено" }, { status: 404 })
    }
    
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при генерации документа" }, 
      { status: 500 }
    )
  }
}
