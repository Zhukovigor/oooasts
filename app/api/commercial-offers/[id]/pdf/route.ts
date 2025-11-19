import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

function transliterate(text: string): string {
  if (!text) return 'offer'
  
  const map: { [key: string]: string } = {
    // Lowercase
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    // Uppercase
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'ZH', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C', 'Ч': 'CH', 'Ш': 'SH', 'Щ': 'SCH', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
    'Э': 'E', 'Ю': 'YU', 'Я': 'YA'
  }
  
  return text
    .split('')
    .map(char => map[char] || (char.charCodeAt(0) > 127 ? '' : char))
    .join('')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'offer'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background-color: white; line-height: 1.4; color: #000; }
            .container { max-width: 800px; margin: 0 auto; padding: 30px; }
            
            /* Header */
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
            .equipment { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .model { font-size: 16px; font-weight: normal; }
            
            /* Price Section */
            .price-section { margin-bottom: 25px; }
            .price-label { font-size: 14px; margin-bottom: 5px; }
            .price-value { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
            .price-vat { font-size: 14px; margin-bottom: 5px; }
            
            /* Conditions */
            .conditions { margin-bottom: 25px; }
            .condition-line { margin-bottom: 3px; font-size: 14px; }
            
            /* Specifications */
            .specs-section { margin-bottom: 20px; }
            .specs-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .specs-table { width: 100%; border-collapse: collapse; font-size: 14px; }
            .specs-table tr { border-bottom: 1px solid #ddd; }
            .specs-table td { padding: 8px 5px; vertical-align: top; }
            .specs-table td:first-child { width: 40%; font-weight: normal; color: #666; }
            .specs-table td:last-child { width: 60%; font-weight: normal; }
            
            /* Footer */
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
            
            @media print { 
              body { background: white; } 
              .container { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
              <div class="equipment">${data.title || 'СЕДЕЛЬНЫЙ ТЯГАЧ'}</div>
              ${data.equipment ? `<div class="model">${data.equipment}</div>` : ""}
            </div>

            <!-- Price -->
            <div class="price-section">
              <div class="price-label">Стоимость техники:</div>
              <div class="price-value">${data.price ? data.price.toLocaleString('ru-RU') : 'N/A'} руб.</div>
              ${data.price_with_vat ? `<div class="price-vat">Стоимость с НДС.</div>` : ""}
              ${data.availability ? `<div class="condition-line">${data.availability}.</div>` : ""}
            </div>

            <!-- Conditions -->
            <div class="conditions">
              ${data.payment_type ? `<div class="condition-line">${data.payment_type}.</div>` : ""}
              ${data.price_with_vat ? `<div class="condition-line">Безналичная оплата с НДС.</div>` : ""}
              ${data.diagnostics_passed ? `<div class="condition-line">Диагностика пройдена.</div>` : ""}
            </div>

            <!-- Specifications -->
            ${
              data.specifications && Object.keys(data.specifications).length > 0
                ? `
                  <div class="specs-section">
                    <div class="specs-title">Технические характеристики</div>
                    <table class="specs-table">
                      ${Object.entries(data.specifications)
                        .map(([key, value]) => `
                          <tr>
                            <td>${key}</td>
                            <td>${value}</td>
                          </tr>
                        `)
                        .join("")}
                    </table>
                  </div>
                `
                : ""
            }

            <!-- Footer -->
            <div class="footer">
              <p>Коммерческое предложение</p>
              <p>Дата создания: ${new Date(data.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const safeFilename = transliterate(data.title || 'commercial-offer')

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${safeFilename}.html"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating PDF:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
