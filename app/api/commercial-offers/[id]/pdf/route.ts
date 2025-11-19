import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// Функция для транслитерации русского текста в латиницу
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

// Функция для форматирования характеристик в строки
function formatSpecifications(specifications: any): Array<Array<[string, string]>> {
  if (!specifications || typeof specifications !== 'object') {
    return []
  }

  const specsEntries = Object.entries(specifications)
  const specsRows: Array<Array<[string, string]>> = []
  
  for (let i = 0; i < specsEntries.length; i += 2) {
    const row: Array<[string, string]> = []
    
    // Первая характеристика в строке
    const [key1, value1] = specsEntries[i] as [string, any]
    row.push([key1, String(value1 || '')])
    
    // Вторая характеристика в строке (если есть)
    if (i + 1 < specsEntries.length) {
      const [key2, value2] = specsEntries[i + 1] as [string, any]
      row.push([key2, String(value2 || '')])
    }
    
    specsRows.push(row)
  }
  
  return specsRows
}

// Функция для получения данных предложения
async function getOfferData(offerId: string) {
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
    .eq("id", offerId)
    .single()

  if (error) {
    throw new Error(`Offer not found: ${error.message}`)
  }

  return data
}

// Функция для генерации HTML контента
function generateHTMLContent(offer: any) {
  const {
    title = "Коммерческое предложение",
    equipment,
    price,
    price_with_vat,
    availability,
    lease,
    payment_type,
    diagnostics_passed,
    image_url,
    specifications,
    created_at
  } = offer

  const specsRows = formatSpecifications(specifications)
  const formattedDate = new Date(created_at).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Коммерческое предложение</title>
    <style>
      * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
      }
      
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        background-color: #f8fafc; 
        color: #334155;
        line-height: 1.6;
      }
      
      .page { 
        max-width: 900px; 
        margin: 30px auto; 
        background: white; 
        padding: 60px 50px; 
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        border-radius: 12px;
      }
      
      .header { 
        margin-bottom: 40px; 
        border-bottom: 3px solid #0066cc; 
        padding-bottom: 20px; 
      }
      
      .header-label { 
        font-size: 11px; 
        text-transform: uppercase; 
        letter-spacing: 2.5px; 
        color: #64748b; 
        margin-bottom: 8px; 
        font-weight: 700; 
      }
      
      .header-type { 
        font-size: 15px; 
        color: #475569; 
        margin-bottom: 10px; 
        font-weight: 600; 
      }
      
      .header h1 { 
        font-size: 36px; 
        font-weight: 700; 
        color: #1e293b; 
        line-height: 1.2;
        margin-bottom: 8px;
      }
      
      .main-content { 
        display: grid; 
        grid-template-columns: ${image_url ? '1fr 1fr' : '1fr'}; 
        gap: 40px; 
        margin-bottom: 50px; 
        align-items: flex-start; 
      }
      
      .image-container { 
        border: 1px solid #e2e8f0; 
        border-radius: 12px; 
        overflow: hidden; 
        background: #f8fafc; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      
      .image-container img { 
        width: 100%; 
        height: auto; 
        display: block; 
        max-height: 400px; 
        object-fit: cover; 
      }
      
      .price-container { 
        background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); 
        color: white; 
        padding: 35px; 
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
      }
      
      .price-label { 
        font-size: 11px; 
        text-transform: uppercase; 
        letter-spacing: 2px; 
        opacity: 0.95; 
        margin-bottom: 12px; 
        font-weight: 700; 
      }
      
      .price-value { 
        font-size: 44px; 
        font-weight: 700; 
        margin-bottom: 25px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .conditions { 
        font-size: 14px; 
        line-height: 1.8; 
      }
      
      .condition-item { 
        margin-bottom: 10px; 
        display: flex; 
        align-items: center;
        padding: 4px 0;
      }
      
      .condition-item:before { 
        content: '✓'; 
        font-weight: 700; 
        margin-right: 10px; 
        font-size: 16px; 
        color: #86efac;
      }
      
      .specs-container { 
        grid-column: 1 / -1; 
      }
      
      .specs-title { 
        font-size: 18px; 
        font-weight: 700; 
        color: #0066cc; 
        margin-bottom: 25px; 
        border-left: 5px solid #0066cc; 
        padding-left: 18px;
        background: linear-gradient(90deg, #f0f9ff, transparent);
        padding-top: 8px;
        padding-bottom: 8px;
        margin-left: -18px;
        padding-right: 18px;
      }
      
      .specs-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px; 
      }
      
      .spec-box { 
        border: 1px solid #e2e8f0; 
        padding: 20px; 
        border-radius: 8px; 
        background: #f8fafc;
        transition: all 0.2s ease;
      }
      
      .spec-box:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        border-color: #cbd5e1;
      }
      
      .spec-label { 
        font-size: 11px; 
        font-weight: 700; 
        color: #64748b; 
        text-transform: uppercase; 
        letter-spacing: 1px; 
        margin-bottom: 8px; 
      }
      
      .spec-value { 
        font-size: 15px; 
        color: #1e293b; 
        font-weight: 600; 
      }
      
      .footer { 
        margin-top: 50px; 
        padding-top: 25px; 
        border-top: 1px solid #e2e8f0; 
        text-align: center; 
        color: #64748b; 
        font-size: 12px;
        line-height: 1.8;
      }
      
      .contact-info {
        margin-top: 15px;
        font-size: 11px;
        color: #94a3b8;
      }
      
      @media print { 
        body { 
          background: white; 
        } 
        
        .page { 
          box-shadow: none; 
          margin: 0; 
          padding: 40px;
          border-radius: 0;
        }
        
        .spec-box:hover {
          transform: none;
          box-shadow: none;
        }
      }
      
      @media (max-width: 768px) {
        .page {
          padding: 30px 20px;
          margin: 15px;
        }
        
        .main-content {
          grid-template-columns: 1fr;
          gap: 25px;
        }
        
        .header h1 {
          font-size: 28px;
        }
        
        .price-value {
          font-size: 36px;
        }
        
        .specs-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div class="header-label">Коммерческое предложение</div>
        ${equipment ? `<div class="header-type">${equipment}</div>` : ""}
        <h1>${title}</h1>
      </div>

      <div class="main-content">
        ${image_url ? `
          <div class="image-container">
            <img src="${image_url}" alt="${title}" onerror="this.style.display='none'" />
          </div>
        ` : ""}

        <div class="price-container">
          <div class="price-label">Стоимость техники</div>
          <div class="price-value">${price ? price.toLocaleString('ru-RU') : 'Цена не указана'} руб.</div>
          <div class="conditions">
            ${price_with_vat ? `<div class="condition-item">Стоимость с НДС: ${price_with_vat.toLocaleString('ru-RU')} руб.</div>` : ""}
            ${availability ? `<div class="condition-item">${availability}</div>` : ""}
            ${lease ? `<div class="condition-item">${lease}</div>` : ""}
            ${payment_type ? `<div class="condition-item">${payment_type}</div>` : ""}
            ${diagnostics_passed ? `<div class="condition-item">Диагностика пройдена</div>` : ""}
          </div>
        </div>
      </div>

      ${specsRows.length > 0 ? `
        <div class="specs-container">
          <div class="specs-title">Технические характеристики</div>
          <div class="specs-grid">
            ${specsRows.map(row => 
              row.map(([key, value]) => `
                <div class="spec-box">
                  <div class="spec-label">${key}</div>
                  <div class="spec-value">${value}</div>
                </div>
              `).join('')
            ).join('')}
          </div>
        </div>
      ` : ""}

      <div class="footer">
        <p>Коммерческое предложение сформировано автоматически</p>
        <p>Дата создания: ${formattedDate}</p>
        <div class="contact-info">
          <p>По вопросам приобретения обращайтесь по контактам, указанным в оригинале документа</p>
        </div>
      </div>
    </div>
  </body>
</html>
`
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = params.id

    if (!offerId) {
      return NextResponse.json({ error: "Offer ID is required" }, { status: 400 })
    }

    // Получаем данные предложения
    const offerData = await getOfferData(offerId)

    // Генерируем HTML контент
    const htmlContent = generateHTMLContent(offerData)
    
    // Создаем безопасное имя файла
    const safeFilename = transliterate(offerData.title || 'commercial-offer')

    // Определяем тип ответа на основе query параметров
    const url = new URL(request.url)
    const download = url.searchParams.get('download')
    const format = url.searchParams.get('format')

    const headers: Record<string, string> = {
      "Content-Type": "text/html; charset=utf-8",
    }

    if (download === 'true' || format === 'html') {
      headers["Content-Disposition"] = `attachment; filename="${safeFilename}.html"`
    } else {
      headers["Content-Disposition"] = `inline; filename="${safeFilename}.html"`
    }

    // Добавляем headers для кэширования
    headers["Cache-Control"] = "public, max-age=3600" // Кэшируем на 1 час

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
