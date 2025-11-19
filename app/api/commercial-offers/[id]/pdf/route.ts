import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import puppeteer from 'puppeteer'

// Функция для транслитерации названия файла
function transliterate(text: string): string {
  if (!text) return 'commercial-offer'
  
  const map: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
    'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
  }
  
  return text
    .split('')
    .map(char => map[char] || (char.charCodeAt(0) > 127 ? '' : char))
    .join('')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .toLowerCase() || 'commercial-offer'
}

// Генерация HTML контента для PDF
function generateHTMLContent(data: any): string {
  const specsEntries = data.specifications ? Object.entries(data.specifications) : []
  const specsRows: Array<Array<[string, string]>> = []
  
  for (let i = 0; i < specsEntries.length; i += 2) {
    const row = [specsEntries[i] as [string, string]]
    if (i + 1 < specsEntries.length) row.push(specsEntries[i + 1] as [string, string])
    specsRows.push(row)
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.title || 'Коммерческое предложение'}</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          body { 
            font-family: 'Arial', 'Helvetica', sans-serif; 
            background-color: #ffffff; 
            color: #333333;
            line-height: 1.4;
          }
          
          .container { 
            max-width: 1000px; 
            margin: 0 auto; 
            background: white; 
            padding: 40px 50px;
          }
          
          /* Header Styles */
          .header { 
            margin-bottom: 40px; 
            border-bottom: 3px solid #0066cc; 
            padding-bottom: 20px; 
          }
          
          .header-label { 
            font-size: 14px; 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            color: #666666; 
            margin-bottom: 8px; 
            font-weight: bold; 
          }
          
          .header-subheader { 
            font-size: 18px; 
            color: #444444; 
            margin-bottom: 12px; 
            font-weight: 500;
          }
          
          .header h1 { 
            font-size: 36px; 
            font-weight: bold; 
            color: #1a1a1a; 
            margin: 0;
          }
          
          /* Content Section */
          .content-section { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
            margin-bottom: 50px; 
            align-items: start; 
          }
          
          .image-box { 
            border: 1px solid #e0e0e0; 
            border-radius: 8px; 
            overflow: hidden; 
            background: #f9f9f9;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .image-box img { 
            width: 100%; 
            height: auto; 
            display: block; 
            max-height: 300px;
            object-fit: cover;
          }
          
          .image-placeholder {
            width: 100%;
            height: 250px;
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 16px;
          }
          
          .price-box { 
            background: linear-gradient(135deg, #0066cc 0%, #004499 100%); 
            color: white; 
            padding: 35px; 
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,102,204,0.3);
          }
          
          .price-label { 
            font-size: 14px; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            opacity: 0.9; 
            margin-bottom: 15px; 
            font-weight: 600;
          }
          
          .price-value { 
            font-size: 42px; 
            font-weight: bold; 
            margin-bottom: 25px; 
          }
          
          .conditions-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .condition { 
            font-size: 16px; 
            display: flex; 
            align-items: center;
            font-weight: 500;
          }
          
          .condition:before { 
            content: '✓'; 
            margin-right: 12px; 
            font-weight: bold; 
            font-size: 18px;
          }
          
          /* Specifications */
          .specs-section { 
            grid-column: 1 / -1; 
            margin-top: 20px;
          }
          
          .specs-title { 
            font-size: 22px; 
            font-weight: bold; 
            color: #0066cc; 
            margin-bottom: 25px; 
            border-left: 5px solid #0066cc; 
            padding-left: 20px;
            padding-top: 5px;
            padding-bottom: 5px;
          }
          
          .specs-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
          }
          
          .spec-item { 
            border: 1px solid #e0e0e0; 
            padding: 20px; 
            border-radius: 8px; 
            background: #fafafa;
            transition: all 0.2s ease;
          }
          
          .spec-item:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
          }
          
          .spec-label { 
            font-size: 13px; 
            font-weight: bold; 
            color: #666666; 
            text-transform: uppercase; 
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          
          .spec-value { 
            font-size: 16px; 
            color: #1a1a1a; 
            font-weight: 600; 
          }
          
          /* Footer */
          .footer { 
            margin-top: 50px; 
            padding-top: 25px; 
            border-top: 2px solid #dddddd; 
            text-align: center; 
            color: #666666; 
            font-size: 14px;
          }
          
          .footer p {
            margin-bottom: 8px;
          }
          
          /* Print Styles */
          @media print { 
            body { 
              background: white; 
            } 
            
            .container { 
              box-shadow: none; 
              margin: 0;
              padding: 20px;
            }
            
            .price-box {
              box-shadow: none;
            }
            
            .spec-item:hover {
              box-shadow: none;
              transform: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="header-label">Коммерческое предложение</div>
            ${data.equipment ? `<div class="header-subheader">${data.equipment}</div>` : ""}
            <h1>${data.title || 'Коммерческое предложение'}</h1>
          </div>

          <!-- Main Content -->
          <div class="content-section">
            <!-- Image -->
            ${data.image_url ? `
              <div class="image-box">
                <img src="${data.image_url}" alt="${data.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="image-placeholder" style="display: none;">
                  Изображение недоступно
                </div>
              </div>
            ` : `
              <div class="image-box">
                <div class="image-placeholder">
                  Изображение не указано
                </div>
              </div>
            `}

            <!-- Price and Conditions -->
            <div class="price-box">
              <div class="price-label">Стоимость техники</div>
              <div class="price-value">${data.price ? data.price.toLocaleString('ru-RU') : 'N/A'} руб.</div>
              <div class="conditions-list">
                ${data.price_with_vat ? `<div class="condition">Стоимость с НДС</div>` : ""}
                ${data.availability ? `<div class="condition">${data.availability}</div>` : ""}
                ${data.payment_type ? `<div class="condition">${data.payment_type}</div>` : ""}
                ${data.lease ? `<div class="condition">Продажа в лизинг</div>` : ""}
                ${data.diagnostics_passed ? `<div class="condition">Диагностика пройдена</div>` : ""}
              </div>
            </div>
          </div>

          <!-- Specifications -->
          ${specsRows.length > 0 ? `
            <div class="specs-section">
              <div class="specs-title">Технические характеристики</div>
              <div class="specs-grid">
                ${specsRows.map(row => 
                  row.map(([key, value]) => `
                    <div class="spec-item">
                      <div class="spec-label">${key}</div>
                      <div class="spec-value">${value}</div>
                    </div>
                  `).join('')
                ).join('')}
              </div>
            </div>
          ` : ""}

          <!-- Footer -->
          <div class="footer">
            <p><strong>Коммерческое предложение</strong></p>
            <p>Дата создания: ${new Date(data.created_at).toLocaleDateString('ru-RU', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p>ID: ${data.id}</p>
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
  let browser: puppeteer.Browser | null = null
  
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

    // Получаем данные предложения
    const { data, error } = await supabase
      .from("commercial_offers")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Коммерческое предложение не найдено" }, { status: 404 })
    }

    // Проверяем, запрашивают ли HTML для предпросмотра
    const url = new URL(request.url)
    const format = url.searchParams.get('format')
    
    if (format === 'html') {
      const htmlContent = generateHTMLContent(data)
      const safeFilename = transliterate(data.title || 'commercial-offer')
      
      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="${safeFilename}.html"`,
        },
      })
    }

    // Генерация настоящего PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    const htmlContent = generateHTMLContent(data)
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    })
    
    // Генерируем PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    })

    await browser.close()

    const safeFilename = transliterate(data.title || 'commercial-offer')
    
    // Возвращаем PDF файл
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error("[PDF Generator] Error:", error)
    
    if (browser) {
      await browser.close()
    }
    
    return NextResponse.json(
      { error: "Ошибка при генерации PDF" }, 
      { status: 500 }
    )
  }
}
