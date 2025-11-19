import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// Helper to create PDF content as base64
function generatePDFContent(offer: any): string {
  const title = offer.title || "Коммерческое предложение"
  const price = offer.price?.toLocaleString("ru-RU") || "N/A"
  const priceWithVat = offer.price_with_vat?.toLocaleString("ru-RU") || price
  const availability = offer.availability || ""
  const paymentType = offer.payment_type || ""

  // Simple PDF generation - returns base64 encoded PDF
  // For production, use a library like jsPDF or pdfkit
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-top: 15px; margin-bottom: 10px; color: #333; }
          .content { margin-left: 10px; line-height: 1.6; }
          .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #555; }
          .value { color: #333; }
          .price-box { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 20px; }
          .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">${title}</div>
        
        <div class="section">
          <div class="price-box">
            <div class="row">
              <span class="label">Стоимость:</span>
              <span class="value">${price} руб.</span>
            </div>
            <div class="row">
              <span class="label">С НДС:</span>
              <span class="value">${priceWithVat} руб.</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Условия</div>
          <div class="content">
            <div class="row">
              <span class="label">Наличие:</span>
              <span class="value">${availability}</span>
            </div>
            <div class="row">
              <span class="label">Способ оплаты:</span>
              <span class="value">${paymentType}</span>
            </div>
          </div>
        </div>

        ${
          offer.specifications
            ? `
          <div class="section">
            <div class="section-title">Технические характеристики</div>
            <div class="content">
              ${Object.entries(offer.specifications)
                .map(([key, value]) => `<div class="row"><span class="label">${key}:</span><span class="value">${value}</span></div>`)
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Коммерческое предложение сформировано ${new Date().toLocaleDateString("ru-RU")}</p>
        </div>
      </body>
    </html>
  `

  return Buffer.from(htmlContent).toString("base64")
}

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

    const specsEntries = data.specifications ? Object.entries(data.specifications) : []
    const specsRows: Array<Array<[string, string]>> = []
    for (let i = 0; i < specsEntries.length; i += 2) {
      const row = [specsEntries[i]]
      if (i + 1 < specsEntries.length) row.push(specsEntries[i + 1])
      specsRows.push(row)
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
            .page { max-width: 900px; margin: 30px auto; background: white; padding: 60px 50px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            
            .header { margin-bottom: 40px; border-bottom: 3px solid #0066cc; padding-bottom: 20px; }
            .header-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2.5px; color: #888; margin-bottom: 8px; font-weight: 700; }
            .header-type { font-size: 15px; color: #666; margin-bottom: 10px; font-weight: 600; }
            .header h1 { font-size: 36px; font-weight: 700; color: #1a1a1a; line-height: 1.2; }
            
            .main-content { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; align-items: flex-start; }
            
            .image-container { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fafafa; }
            .image-container img { width: 100%; height: auto; display: block; max-height: 400px; object-fit: cover; }
            
            .price-container { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 35px; border-radius: 10px; }
            .price-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.95; margin-bottom: 12px; font-weight: 700; }
            .price-value { font-size: 44px; font-weight: 700; margin-bottom: 25px; }
            .conditions { font-size: 14px; line-height: 1.8; }
            .condition-item { margin-bottom: 10px; display: flex; align-items: center; }
            .condition-item:before { content: '✓'; font-weight: 700; margin-right: 10px; font-size: 16px; }
            
            .specs-container { grid-column: 1 / -1; }
            .specs-title { font-size: 18px; font-weight: 700; color: #0066cc; margin-bottom: 25px; border-left: 5px solid #0066cc; padding-left: 18px; }
            
            .specs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .spec-box { border: 1px solid #e0e0e0; padding: 18px; border-radius: 8px; background: #f9f9f9; }
            .spec-label { font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .spec-value { font-size: 15px; color: #1a1a1a; font-weight: 600; }
            
            .footer { margin-top: 50px; padding-top: 25px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px; }
            
            @media print { 
              body { background: white; } 
              .page { box-shadow: none; margin: 0; padding: 40px; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="header-label">Коммерческое предложение</div>
              ${data.equipment ? `<div class="header-type">${data.equipment}</div>` : ""}
              <h1>${data.title}</h1>
            </div>

            <div class="main-content">
              ${data.image_url ? `
                <div class="image-container">
                  <img src="${data.image_url}" alt="${data.title}" />
                </div>
              ` : ""}

              <div class="price-container">
                <div class="price-label">Стоимость техники</div>
                <div class="price-value">${data.price ? data.price.toLocaleString('ru-RU') : 'N/A'} руб.</div>
                <div class="conditions">
                  ${data.price_with_vat ? `<div class="condition-item">Стоимость с НДС</div>` : ""}
                  ${data.availability ? `<div class="condition-item">${data.availability}</div>` : ""}
                  ${data.lease ? `<div class="condition-item">Продажа в лизинг</div>` : ""}
                  ${data.payment_type ? `<div class="condition-item">${data.payment_type}</div>` : ""}
                  ${data.diagnostics_passed ? `<div class="condition-item">Диагностика пройдена</div>` : ""}
                </div>
              </div>
            </div>

            ${specsRows.length > 0 ? `
              <div class="specs-container">
                <div class="specs-title">Технические характеристики</div>
                <div class="specs-grid">
                  ${specsRows.map(row => row.map(([key, value]) => `
                    <div class="spec-box">
                      <div class="spec-label">${key}</div>
                      <div class="spec-value">${value}</div>
                    </div>
                  `).join('')).join('')}
                </div>
              </div>
            ` : ""}

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
