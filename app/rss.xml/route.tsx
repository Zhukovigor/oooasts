import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Ревалидация каждый час
export const revalidate = 3600

// Функция для экранирования специальных XML-символов
function escapeXml(unsafe: string): string {
  if (!unsafe) return ""
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// Функция для преобразования HTML в читаемый текстовый формат с сохранением структуры
function htmlToReadableText(html: string): string {
  if (!html) return ""
  
  let text = html
    // Сохраняем эмодзи и специальные символы
    .replace(/🏗️/g, '🏗️')
    .replace(/🚜/g, '🚜')
    .replace(/✅/g, '✅')
    .replace(/💬/g, '💬')
    .replace(/💰/g, '💰')
    .replace(/⚡/g, '⚡')
    .replace(/🛠️/g, '🛠️')
    // Заголовки с отступами
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n🟦 $1\n────────────────────\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n🔷 $1\n────────────────────\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n🔹 $1\n────────────────────\n')
    .replace(/<h[4-6][^>]*>(.*?)<\/h[4-6]>/gi, '\n\n▸ $1\n')
    // Жирный текст
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    // Курсив
    .replace(/<em>(.*?)<\/em>/gi, '_$1_')
    .replace(/<i>(.*?)<\/i>/gi, '_$1_')
    // Списки
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1')
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
      return '\n' + items.map((item, index) => {
        return `${index + 1}. ${item.replace(/<li[^>]*>(.*?)<\/li>/i, '$1')}`
      }).join('\n')
    })
    // Цитаты
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n┌────────────────────┐\n│ $1                │\n└────────────────────┘\n')
    // Таблицы (упрощенно)
    .replace(/<table[^>]*>(.*?)<\/table>/gis, '\n[Таблица данных]\n')
    // Ссылки
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 (🔗 ссылка)')
    // Переносы строк и абзацы
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
    .replace(/<div[^>]*>(.*?)<\/div>/gi, '\n$1\n')
    // Удаляем оставшиеся HTML-теги
    .replace(/<[^>]*>/g, '')
    // Очищаем лишние переносы
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    // Исправляем множественные пробелы
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

// Функция для создания красивого описания
function createBeautifulExcerpt(html: string, maxLength: number = 150): string {
  if (!html) return ""
  
  // Сначала получаем чистый текст без HTML
  let text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Обрезаем до максимальной длины, но не обрезаем слова
  if (text.length > maxLength) {
    text = text.substring(0, maxLength)
    const lastSpace = text.lastIndexOf(' ')
    if (lastSpace > 0) {
      text = text.substring(0, lastSpace)
    }
    text += '...'
  }
  
  return text
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Получаем опубликованные статьи
    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Ошибка при получении статей:", error)
      return new NextResponse("Ошибка при получении статей", { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts-nsk.ru"

    // Генерируем элементы RSS
    const rssItems = articles?.map((article) => {
      const articleUrl = `${baseUrl}/stati/${article.slug}`
      const pubDate = new Date(article.published_at).toUTCString()

      // Создаем красивые тексты
      const beautifulExcerpt = createBeautifulExcerpt(article.excerpt || article.content || "")
      const beautifulFullText = htmlToReadableText(article.content || article.excerpt || "")

      // Формируем медиа-контент
      let mediaContent = ""
      if (article.main_image) {
        const imageUrl = article.main_image.startsWith("http") 
          ? article.main_image 
          : `${baseUrl}${article.main_image.startsWith("/") ? "" : "/"}${article.main_image}`
        
        mediaContent = `
      <media:group>
        <media:content url="${escapeXml(imageUrl)}" type="image/jpeg"/>
        <media:thumbnail url="${escapeXml(imageUrl)}"/>
      </media:group>`
      }

      return `    <item>
      <title>${escapeXml(article.title || "")}</title>
      <link>${escapeXml(articleUrl)}</link>
      <description>${escapeXml(beautifulExcerpt)}</description>
      <author>${escapeXml(article.author || "ООО АСТС")}</author>
      <category>${escapeXml(article.category || "Статьи")}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <yandex:genre>article</yandex:genre>
      <yandex:full-text>${escapeXml(beautifulFullText)}</yandex:full-text>${mediaContent}
    </item>`
    }).join("\n") || ""

    // Собираем полный RSS-фид
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:yandex="http://news.yandex.ru" 
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>ООО АСТС - Статьи и новости</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Актуальные статьи и новости о спецтехнике, экскаваторах, автобетононасосах и строительном оборудовании от компании АСТС 🏗️🚜</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    })
  } catch (error) {
    console.error("Ошибка при генерации RSS-ленты:", error)
    return new NextResponse("Ошибка при генерации RSS-ленты", { status: 500 })
  }
}
