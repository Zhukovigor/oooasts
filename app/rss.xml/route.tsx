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

// Функция для преобразования HTML в формат, поддерживаемый Дзеном
function htmlToDzenFormat(html: string): string {
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
    
    // Конвертируем теги в поддерживаемые Дзеном
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '<h1>$1</h1>')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<h2>$1</h2>')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '<h3>$1</h3>')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '<h4>$1</h4>')
    .replace(/<h[5-6][^>]*>(.*?)<\/h[5-6]>/gi, '<h4>$1</h4>') // h5-h6 -> h4
    
    // Жирный текст
    .replace(/<strong>(.*?)<\/strong>/gi, '<b>$1</b>')
    
    // Курсив
    .replace(/<em>(.*?)<\/em>/gi, '<i>$1</i>')
    
    // Подчеркивание и зачеркивание (если есть в исходном HTML)
    .replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>')
    .replace(/<s>(.*?)<\/s>/gi, '<s>$1</s>')
    .replace(/<strike>(.*?)<\/strike>/gi, '<s>$1</s>')
    
    // Списки - Дзен требует строгую структуру
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      const listItems = content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
      const formattedItems = listItems.map(item => 
        item.replace(/<li[^>]*>(.*?)<\/li>/i, '<li>$1</li>')
      ).join('')
      return `<ul>${formattedItems}</ul>`
    })
    
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      const listItems = content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
      const formattedItems = listItems.map(item => 
        item.replace(/<li[^>]*>(.*?)<\/li>/i, '<li>$1</li>')
      ).join('')
      return `<ol>${formattedItems}</ol>`
    })
    
    // Цитаты
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '<blockquote>$1</blockquote>')
    
    // Ссылки
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '<a href="$1">$2</a>')
    
    // Абзацы - Дзен требует <p> теги
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '<p>$1</p>')
    .replace(/<div[^>]*>(.*?)<\/div>/gi, '<p>$1</p>')
    .replace(/<br\s*\/?>/gi, '<br/>')
    
    // Удаляем неподдерживаемые теги, но сохраняем их содержимое
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<form[^>]*>.*?<\/form>/gi, '')
    
    // Очищаем лишние пробелы
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

// Функция для создания текстового описания (для Яндекс)
function htmlToReadableText(html: string): string {
  if (!html) return ""
  
  let text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  return text
}

// Функция для создания описания для карточки
function createBeautifulExcerpt(html: string, maxLength: number = 150): string {
  if (!html) return ""
  
  let text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
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

// Функция для получения размера изображения по URL (заглушка)
// В реальном приложении нужно реализовать получение размера изображения
async function getImageSize(url: string): Promise<number> {
  // Заглушка - возвращаем примерный размер
  // В реальном приложении можно использовать fetch HEAD запрос
  return 102400; // 100KB в байтах
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Получаем опубликованные статьи за последние 3 дня для Дзена
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .not("published_at", "is", null)
      .gte("published_at", threeDaysAgo.toISOString())
      .order("published_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Ошибка при получении статей:", error)
      return new NextResponse("Ошибка при получении статей", { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts-nsk.ru"
    const rssUrl = `${baseUrl}/api/rss`

    // Генерируем элементы RSS
    const rssItems = await Promise.all(articles?.map(async (article) => {
      const articleUrl = `${baseUrl}/stati/${article.slug}`
      
      // Форматируем дату для Дзена (RFC 822)
      const pubDate = new Date(article.published_at).toUTCString()

      // Создаем контент для разных платформ
      const beautifulExcerpt = createBeautifulExcerpt(article.excerpt || article.content || "")
      const beautifulFullText = htmlToReadableText(article.content || article.excerpt || "")
      const dzenFormattedContent = htmlToDzenFormat(article.content || article.excerpt || "")

      // Формируем медиа-контент
      let mediaContent = ""
      let enclosureContent = ""
      
      if (article.main_image) {
        const imageUrl = article.main_image.startsWith("http") 
          ? article.main_image 
          : `${baseUrl}${article.main_image.startsWith("/") ? "" : "/"}${article.main_image}`
        
        const imageSize = await getImageSize(imageUrl)

        // Медиа-контент для Яндекса - исправленная версия
        mediaContent = `
        <media:content url="${escapeXml(imageUrl)}" type="image/jpeg" medium="image"/>
        <media:thumbnail url="${escapeXml(imageUrl)}"/>`

        // Enclosure для Дзена (обложка) - добавляем атрибут length
        enclosureContent = `
        <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="${imageSize}"/>`

        // Добавляем изображение в контент для Дзена, если его там нет
        if (!dzenFormattedContent.includes('<img')) {
          // Изображение будет добавлено в content:encoded
        }
      }

      // Определяем категории для Дзена
      const dzenCategories = [
        'format-article', // или 'format-post' для постов
        'index', // или 'noindex'
        'comment-all' // или 'comment-subscribers', 'comment-none'
      ].map(cat => `        <category>${cat}</category>`).join('\n')

      return `    <item>
        <title>${escapeXml(article.title || "")}</title>
        <link>${escapeXml(articleUrl)}</link>
        <description>${escapeXml(beautifulExcerpt)}</description>
        <author>info@asts-nsk.ru (ООО АСТС)</author>
        <category>${escapeXml(article.category || "Статьи")}</category>
        <pubDate>${pubDate}</pubDate>
        <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
        <!-- Яндекс специфичные теги -->
        <yandex:full-text>${escapeXml(beautifulFullText)}</yandex:full-text>${mediaContent}
        <!-- Дзен специфичные теги -->${enclosureContent}
${dzenCategories}
        <content:encoded><![CDATA[<h1>${escapeXml(article.title || "")}</h1>${dzenFormattedContent}]]></content:encoded>
      </item>`
    }) || [])

    // Собираем полный RSS-фид с поддержкой обеих платформ
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:yandex="http://news.yandex.ru" 
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ООО АСТС - Статьи и новости</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Актуальные статьи и новости о спецтехнике, экскаваторах, автобетононасосах и строительном оборудовании от компании АСТС</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(rssUrl)}" rel="self" type="application/rss+xml"/>
    <webMaster>info@asts-nsk.ru (ООО АСТС)</webMaster>
    <managingEditor>info@asts-nsk.ru (ООО АСТС)</managingEditor>
${rssItems.join("\n")}
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
