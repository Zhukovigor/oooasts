import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import chromium from "chrome-aws-lambda"
import puppeteer from "puppeteer-core"

// Функция транслитерации (оставляем как есть)
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

    // Генерируем HTML, максимально приближенный к макету
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
            body { background: white; padding: 40px; }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 24px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .header-subheader {
              font-size: 16px;
              color: #555;
              margin-bottom: 10px;
            }
            .header-title {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 20px;
            }

            .content-row {
              display: flex;
              gap: 40px;
              margin-bottom: 30px;
            }

            .image-box {
              flex: 0 0 40%;
              border: 1px solid #ddd;
              overflow: hidden;
              background: #f9f9f9;
            }
            .image-box img {
              width: 100%;
              height: auto;
              display: block;
            }

            .price-box {
              flex: 1;
              padding: 20px;
            }
            .price-label {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .price-value {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #000;
            }
            .price-condition {
              font-size: 14px;
              margin-top: 5px;
              line-height: 1.5;
            }

            .specs-section {
              margin-top: 40px;
            }
            .specs-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 2px solid #000;
              padding-bottom: 5px;
            }

            .specs-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .specs-table th,
            .specs-table td {
              padding: 8px 12px;
              border-bottom: 1px solid #ddd;
              text-align: left;
            }
            .specs-table th {
              font-weight: bold;
              background: #f5f5f5;
            }

            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }

            @media print {
              body { padding: 20px; }
              .content-row { gap: 20px; }
              .image-box { flex: 0 0 35%; }
              .price-box { flex: 1; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Коммерческое предложение</h1>
            ${data.equipment ? `<div class="header-subheader">${data.equipment}</div>` : ""}
            <div class="header-title">${data.title}</div>
          </div>

          <div class="content-row">
            ${data.image_url ? `
              <div class="image-box">
                <img src="${data.image_url}" alt="${data.title}" />
              </div>
            ` : ""}

            <div class="price-box">
              <div class="price-label">Стоимость техники:</div>
              <div class="price-value">${data.price ? data.price.toLocaleString('ru-RU') : 'N/A'} руб.</div>
              ${data.price_with_vat ? `<div class="price-condition">Стоимость с НДС.</div>` : ""}
              ${data.availability ? `<div class="price-condition">${data.availability}</div>` : ""}
              ${data.diagnostics_passed ? `<div class="price-condition">Диагностика пройдена.</div>` : ""}
              ${data.payment_type ? `<div class="price-condition">${data.payment_type}</div>` : ""}
            </div>
          </div>

          ${data.specifications && Object.keys(data.specifications).length > 0 ? `
            <div class="specs-section">
              <div class="specs-title">Технические характеристики</div>
              <table class="specs-table">
                <tbody>
                  ${Object.entries(data.specifications)
                    .map(([key, value]) => `
                      <tr>
                        <td style="width: 40%;"><strong>${key}</strong></td>
                        <td>${value}</td>
                      </tr>
                    `)
                    .join('')}
                </tbody>
              </table>
            </div>
          ` : ""}

          <div class="footer">
            <p>Коммерческое предложение сформировано ${new Date().toLocaleDateString('ru-RU')}</p>
          </div>
        </body>
      </html>
    `

    // Запускаем Puppeteer для генерации PDF
    let browser
    try {
      const executablePath = await chromium.executablePath({
        cacheDir: process.env.CHROME_CACHE_DIR || '/tmp/chrome-cache',
      })

      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      })

      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

      // Генерируем PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      })

      await browser.close()

      const safeFilename = transliterate(data.title || 'commercial-offer')

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${safeFilename}.pdf"`,
        },
      })

    } catch (puppeteerError) {
      console.error("[PDF Generation Error]", puppeteerError)
      throw new Error("Failed to generate PDF")
    }

  } catch (error) {
    console.error("[v0] Error generating PDF:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
