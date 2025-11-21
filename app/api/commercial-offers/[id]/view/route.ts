import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const offerId = params.id
    if (!offerId) {
      return NextResponse.json({ error: "ID предложения обязателен" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    })

    const { data, error } = await supabase.from("commercial_offers").select("*").eq("id", offerId).single()

    if (error || !data) {
      return NextResponse.json({ error: "Коммерческое предложение не найдено" }, { status: 404 })
    }

    const htmlContent = generateStrictFormatPDF(data)

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error: any) {
    console.error("View generation error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

function generateStrictFormatPDF(data: any): string {
  const specs = data.specifications || {}
  const specsArray = Object.entries(specs)

  const specsHTML = specsArray
    .map(
      ([key, value]) =>
        `<tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-weight: 500; color: #666; width: 40%; font-size: 13px;">${escapeHtml(String(key))}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; color: #333; width: 60%; font-size: 13px; text-align: right;">${escapeHtml(String(value))}</td>
    </tr>`,
    )
    .join("")

  const formattedPrice = data.price ? data.price.toLocaleString("ru-RU") : "Не указана"

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title || "КП")}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
    
    .page {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
      background: white;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
    }

    .header-small-text {
      font-size: 11px;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 5px;
    }

    .header-category {
      font-size: 13px;
      letter-spacing: 0.5px;
      color: #999;
      margin-bottom: 8px;
    }

    .header-title {
      font-size: 36px;
      font-weight: bold;
      color: #000;
      margin-bottom: 5px;
    }

    .content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }

    .image-box {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      border-radius: 4px;
      min-height: 300px;
      overflow: hidden;
    }

    .image-box img {
      max-width: 100%;
      max-height: 300px;
      object-fit: contain;
    }

    .price-box {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .price-label {
      font-size: 12px;
      color: #999;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .price-value {
      font-size: 32px;
      font-weight: bold;
      color: #000;
      margin-bottom: 15px;
    }

    .conditions-list {
      list-style: none;
      font-size: 12px;
      line-height: 1.8;
      color: #333;
    }

    .conditions-list li {
      margin-bottom: 6px;
    }

    .conditions-list li:before {
      content: "• ";
      color: #999;
      margin-right: 6px;
    }

    .specs-section {
      margin-top: 40px;
    }

    .specs-title {
      font-size: 14px;
      font-weight: bold;
      color: #000;
      margin-bottom: 12px;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
    }

    .specs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .specs-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .specs-table td:first-child {
      font-weight: 500;
      color: #666;
      width: 40%;
    }

    .specs-table td:last-child {
      color: #333;
      width: 60%;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-small-text">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</div>
      ${data.equipment ? `<div class="header-category">${escapeHtml(data.equipment)}</div>` : ""}
      <div class="header-title">${escapeHtml(data.title || "Без названия")}</div>
    </div>

    <!-- Content: Image + Price -->
    <div class="content">
      <div class="image-box">
        ${
          data.image_url
            ? `<img src="${escapeHtml(data.image_url)}" alt="${escapeHtml(data.title)}" onerror="this.style.display='none'">`
            : `<div style="color: #999; text-align: center;">Нет изображения</div>`
        }
      </div>

      <div class="price-box">
        <div>
          <div class="price-label">Стоимость техники:</div>
          <div class="price-value">${formattedPrice} руб.</div>
          ${data.vat_included ? `<div style="font-size: 12px; color: #666; margin-bottom: 15px;">Стоимость с НДС.</div>` : ""}
        </div>

        <ul class="conditions-list">
          ${data.availability ? `<li>${escapeHtml(data.availability)}</li>` : ""}
          ${data.lease ? `<li>Продажа в лизинг.</li>` : ""}
          ${data.payment_type ? `<li>${escapeHtml(data.payment_type)}</li>` : ""}
          ${data.diagnostics_passed ? `<li>Диагностика пройдена.</li>` : ""}
        </ul>
      </div>
    </div>

    <!-- Specifications Table -->
    ${
      specsArray.length > 0
        ? `
    <div class="specs-section">
      <div class="specs-title">Технические характеристики</div>
      <table class="specs-table">
        <tbody>
          ${specsHTML}
        </tbody>
      </table>
    </div>
    `
        : ""
    }
  </div>
</body>
</html>
`
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
