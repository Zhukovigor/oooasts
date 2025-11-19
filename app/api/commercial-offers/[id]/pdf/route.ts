// app/api/commercial-offers/[id]/pdf/route.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

function transliterate(text: string): string {
  if (!text) return 'offer'
  
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
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'offer'
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

    // Форматируем спецификации для таблицы
    const specsEntries = data.specifications ? Object.entries(data.specifications) : []
    const specsRows: Array<Array<[string, string]>> = []
    for (let i = 0; i < specsEntries.length; i += 2) {
      const row = [specsEntries[i]]
      if (i + 1 < specsEntries.length) row.push(specsEntries[i + 1])
      specsRows.push(row)
    }

    // Создаем красивый HTML
    const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title || 'Коммерческое предложение'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 50px 60px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 300px;
            height: 300px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(100px, -100px);
        }
        
        .header-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 42px;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            font-size: 20px;
            opacity: 0.9;
            font-weight: 400;
        }
        
        .content {
            padding: 60px;
        }
        
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 60px;
            margin-bottom: 60px;
        }
        
        .image-section {
            background: #f8fafc;
            border-radius: 16px;
            padding: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
        }
        
        .image-placeholder {
            text-align: center;
            color: #64748b;
        }
        
        .image-placeholder svg {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
            opacity: 0.5;
        }
        
        .price-card {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 15px 40px rgba(5, 150, 105, 0.3);
        }
        
        .price-label {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .price-value {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 30px;
            line-height: 1;
        }
        
        .conditions {
            space-y: 15px;
        }
        
        .condition {
            display: flex;
            align-items: center;
            font-size: 16px;
            margin-bottom: 12px;
        }
        
        .condition::before {
            content: '✓';
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            margin-right: 12px;
            font-size: 14px;
            font-weight: bold;
        }
        
        .specs-section {
            background: #f8fafc;
            border-radius: 16px;
            padding: 40px;
        }
        
        .section-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
        }
        
        .section-title::before {
            content: '';
            display: block;
            width: 4px;
            height: 24px;
            background: #3b82f6;
            margin-right: 12px;
            border-radius: 2px;
        }
        
        .specs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .spec-item {
            background: white;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }
        
        .spec-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .spec-label {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }
        
        .spec-value {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        @media (max-width: 968px) {
            .main-grid {
                grid-template-columns: 1fr;
                gap: 30px;
            }
            
            .header, .content {
                padding: 30px;
            }
            
            .header h1 {
                font-size: 32px;
            }
        }
        
        @media print {
            body {
                background: white !important;
                padding: 0 !important;
            }
            
            .container {
                box-shadow: none !important;
                border-radius: 0 !important;
                margin: 0 !important;
                max-width: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-badge">Коммерческое предложение</div>
            <h1>${data.title || 'Спецтехника'}</h1>
            ${data.equipment ? `<div class="header-subtitle">${data.equipment}</div>` : ''}
        </div>
        
        <div class="content">
            <div class="main-grid">
                <div class="image-section">
                    ${data.image_url ? 
                        `<img src="${data.image_url}" alt="${data.title}" style="max-width: 100%; border-radius: 12px;" />` : 
                        `<div class="image-placeholder">
                            <svg fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z"/>
                            </svg>
                            <p>Изображение техники</p>
                        </div>`
                    }
                </div>
                
                <div class="price-card">
                    <div class="price-label">Стоимость техники</div>
                    <div class="price-value">${data.price ? data.price.toLocaleString('ru-RU') : '—'} ₽</div>
                    <div class="conditions">
                        ${data.price_with_vat ? `<div class="condition">Стоимость с НДС</div>` : ''}
                        ${data.availability ? `<div class="condition">${data.availability}</div>` : ''}
                        ${data.payment_type ? `<div class="condition">${data.payment_type}</div>` : ''}
                        ${data.lease ? `<div class="condition">Продажа в лизинг</div>` : ''}
                        ${data.diagnostics_passed ? `<div class="condition">Диагностика пройдена</div>` : ''}
                        ${data.vat_included ? `<div class="condition">НДС включен</div>` : ''}
                    </div>
                </div>
            </div>
            
            ${specsRows.length > 0 ? `
                <div class="specs-section">
                    <div class="section-title">Технические характеристики</div>
                    <div class="specs-grid">
                        ${specsRows.flat().map(([key, value]) => `
                            <div class="spec-item">
                                <div class="spec-label">${key}</div>
                                <div class="spec-value">${value}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="footer">
                <p>Коммерческое предложение действительно до ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}</p>
                <div class="contact-info">
                    <div class="contact-item">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z"/>
                        </svg>
                        +7 (999) 123-45-67
                    </div>
                    <div class="contact-item">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z"/>
                        </svg>
                        info@company.ru
                    </div>
                    <div class="contact-item">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                        </svg>
                        г. Москва, ул. Примерная, 123
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`

    const safeFilename = transliterate(data.title || 'commercial-offer')

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${safeFilename}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
