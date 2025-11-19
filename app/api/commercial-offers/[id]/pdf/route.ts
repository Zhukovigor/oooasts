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

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background-color: #f5f5f5; }
            .container { max-width: 900px; margin: 20px auto; background: white; padding: 50px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #0066cc; padding-bottom: 20px; }
            .header h1 { font-size: 36px; font-weight: bold; color: #1a1a1a; margin-bottom: 10px; }
            .header .subheader { font-size: 18px; color: #666; }
            .price-section { background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 40px; }
            .price-label { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 8px; }
            .price-value { font-size: 42px; font-weight: bold; margin-bottom: 15px; }
            .price-vat { font-size: 14px; opacity: 0.9; }
            .section { margin-bottom: 35px; }
            .section-title { font-size: 20px; font-weight: bold; color: #0066cc; margin-bottom: 15px; border-left: 4px solid #0066cc; padding-left: 15px; }
            .conditions { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .condition-item { background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 3px solid #0066cc; }
            .condition-label { font-size: 13px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 5px; }
            .condition-value { font-size: 14px; color: #1a1a1a; font-weight: 600; }
            .specs-table { width: 100%; border-collapse: collapse; }
            .specs-table tr { border-bottom: 1px solid #e0e0e0; }
            .specs-table td { padding: 12px 15px; }
            .specs-table td:first-child { width: 50%; font-weight: 600; color: #666; }
            .specs-table td:last-child { text-align: right; color: #1a1a1a; font-weight: 500; }
            .specs-table tr:hover { background-color: #f9f9f9; }
            .image-section { text-align: center; margin-bottom: 40px; }
            .image-section img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px; }
            .diagnostic-badge { background: #d4edda; color: #155724; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 15px; }
            @media print { 
              body { background: white; } 
              .container { box-shadow: none; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.title}</h1>
              ${data.equipment ? `<div class="subheader">${data.equipment}</div>` : ""}
            </div>

            ${data.image_url ? `
              <div class="image-section">
                <img src="${data.image_url}" alt="${data.title}" style="max-height: 300px;">
              </div>
            ` : ""}

            <div class="price-section">
              <div class="price-label">Стоимость техники</div>
              <div class="price-value">${data.price ? data.price.toLocaleString('ru-RU') : 'N/A'} руб.</div>
              ${data.price_with_vat ? `<div class="price-vat">Стоимость с НДС: ${data.price_with_vat.toLocaleString('ru-RU')} руб.</div>` : ""}
            </div>

            <div class="section">
              <div class="section-title">Условия поставки</div>
              ${data.diagnostics_passed ? `<div class="diagnostic-badge">✓ Диагностика пройдена</div>` : ""}
              <div class="conditions">
                ${data.availability ? `
                  <div class="condition-item">
                    <div class="condition-label">Наличие</div>
                    <div class="condition-value">${data.availability}</div>
                  </div>
                ` : ""}
                ${data.payment_type ? `
                  <div class="condition-item">
                    <div class="condition-label">Способ оплаты</div>
                    <div class="condition-value">${data.payment_type}</div>
                  </div>
                ` : ""}
              </div>
            </div>

            ${
              data.specifications && Object.keys(data.specifications).length > 0
                ? `
                  <div class="section">
                    <div class="section-title">Технические характеристики</div>
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

            <div class="footer">
              <p>Коммерческое предложение</p>
              <p>Дата создания: ${new Date(data.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin-top: 10px; color: #bbb; font-size: 11px;">Для сохранения как PDF используйте Файл → Печать → Сохранить как PDF</p>
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
