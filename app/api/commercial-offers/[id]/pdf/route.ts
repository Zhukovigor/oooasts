// app/api/commercial-offers/[id]/pdf/route.ts - УПРОЩЕННАЯ РАБОЧАЯ ВЕРСИЯ
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🔍 PDF GENERATION STARTED");
  
  try {
    const offerId = params.id;
    console.log("📄 Generating PDF for offer:", offerId);
    
    if (!offerId) {
      return NextResponse.json({ error: "ID предложения обязателен" }, { status: 400 });
    }

    // Получение данных предложения
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Игнорируем запись кук
          },
        },
      }
    );

    console.log("🔍 Fetching offer data from Supabase...");
    const { data, error } = await supabase
      .from("commercial_offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (error || !data) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json(
        { error: "Коммерческое предложение не найдено" },
        { status: 404 }
      );
    }

    console.log("✅ Found offer:", data.title);

    // Временно возвращаем HTML вместо PDF для тестирования
    const htmlContent = generateSimpleHTML(data);
    
    // Если нужно реальное PDF, можно использовать сервис вроде Gotenberg или API
    // Но для начала вернем HTML чтобы убедиться что данные работают
    
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="offer-${offerId}.html"`,
      },
    });

  } catch (error: any) {
    console.error("💥 PDF generation error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера: " + error.message },
      { status: 500 }
    );
  }
}

function generateSimpleHTML(data: any): string {
  const specs = data.specifications || {};
  const specsEntries = Object.entries(specs);
  
  // Форматируем спецификации в таблицу
  const specsHTML = specsEntries.map(([key, value]) => 
    `<tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #f9f9f9;">${escapeHtml(key)}</td><td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(String(value))}</td></tr>`
  ).join('');

  const formattedDate = new Date(data.created_at).toLocaleDateString('ru-RU');
  const formattedPrice = data.price ? data.price.toLocaleString('ru-RU') : 'Не указана';
  const formattedPriceWithVat = data.price_with_vat ? data.price_with_vat.toLocaleString('ru-RU') : null;

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(data.title)} - Коммерческое предложение</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
        }
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 0 10px 0;
            color: #000;
        }
        .header h2 {
            font-size: 20px;
            margin: 10px 0;
            color: #0066cc;
        }
        .price-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .price-main {
            font-size: 28px;
            font-weight: bold;
            color: #0066cc;
            margin: 10px 0;
        }
        .price-secondary {
            font-size: 16px;
            color: #666;
            margin: 5px 0;
        }
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .details-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background: #fff;
        }
        .specs-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .specs-table th {
            background: #0066cc;
            color: white;
            padding: 12px;
            text-align: left;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            background: #28a745;
            color: white;
            border-radius: 4px;
            font-size: 12px;
            margin: 2px;
        }
        @media print {
            body { margin: 0; padding: 0; }
            .container { box-shadow: none; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
            ${data.equipment ? `<h3>${escapeHtml(data.equipment)}</h3>` : ''}
            <h2>${escapeHtml(data.title || 'Без названия')}</h2>
        </div>

        <div class="price-section">
            <div class="price-main">${formattedPrice} руб.</div>
            ${formattedPriceWithVat ? `<div class="price-secondary">С НДС: ${formattedPriceWithVat} руб.</div>` : ''}
            ${data.availability ? `<div class="badge">${escapeHtml(data.availability)}</div>` : ''}
            ${data.diagnostics_passed ? `<div class="badge">Диагностика пройдена</div>` : ''}
        </div>

        ${data.description ? `
        <div class="details-card">
            <h3>Описание</h3>
            <p>${escapeHtml(data.description)}</p>
        </div>
        ` : ''}

        <div class="details-grid">
            ${data.payment_type ? `
            <div class="details-card">
                <h4>💳 Способ оплаты</h4>
                <p>${escapeHtml(data.payment_type)}</p>
            </div>
            ` : ''}
            
            ${data.lease ? `
            <div class="details-card">
                <h4>📋 Условия</h4>
                <p>${escapeHtml(data.lease)}</p>
            </div>
            ` : ''}
        </div>

        ${specsEntries.length > 0 ? `
        <div class="details-card">
            <h3>🔧 Технические характеристики</h3>
            <table class="specs-table">
                <tbody>
                    ${specsHTML}
                </tbody>
            </table>
        </div>
        ` : '<p style="text-align: center; color: #666; padding: 20px;">Технические характеристики не указаны</p>'}

        ${data.image_url ? `
        <div class="details-card" style="text-align: center;">
            <h3>🖼️ Изображение</h3>
            <img src="${escapeHtml(data.image_url)}" alt="${escapeHtml(data.title)}" 
                 style="max-width: 100%; max-height: 300px; border-radius: 8px;"
                 onerror="this.style.display='none'">
        </div>
        ` : ''}

        <div class="footer">
            <p>Коммерческое предложение сформировано автоматически</p>
            <p><strong>Дата создания:</strong> ${formattedDate} | <strong>ID:</strong> ${data.id}</p>
            <p style="font-size: 12px; color: #999;">Действительно в течение 30 дней с даты создания</p>
        </div>
    </div>
</body>
</html>
`;
}

// Вспомогательная функция для экранирования HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Опционально: POST метод для генерации PDF с кастомными параметрами
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = params.id;
    
    if (!offerId) {
      return NextResponse.json(
        { error: "Некорректный ID коммерческого предложения" },
        { status: 400 }
      );
    }

    // Редирект на GET
    return NextResponse.redirect(new URL(`/api/commercial-offers/${offerId}/pdf`, request.url), 307);

  } catch (error) {
    console.error("Ошибка в POST обработчике PDF:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
