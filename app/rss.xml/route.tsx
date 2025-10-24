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
      .limit(50) // Дзен рекомендует не более 500 за раз

    if (error) {
      console.error("Ошибка при получении статей:", error)
      return new NextResponse("Ошибка при получении статей", { status: 500 })
    }

    // Проверяем минимальные требования Дзена
    if (!articles || articles.length < 10) {
      console.warn("Дзен требует минимум 10 материалов при первой настройке")
      // Можно либо вернуть ошибку, либо продолжить с предупреждением
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts-nsk.ru"

    // Генерируем элементы RSS
    const rssItems = articles?.map((article) => {
      const articleUrl = `${baseUrl}/stati/${article.slug}`
      
      // Форматируем дату для Дзена (RFC 822)
      const pubDate = new Date(article.published_at).toUTCString()
      const pubDateDzen = new Date(article.published_at).toUTCString().replace('GMT', '+0000')

      // Создаем контент для разных платформ
      const beautifulExcerpt = createBeautifulExcerpt(article.excerpt || article.content || "")
      const beautifulFullText = htmlToReadableText(article.content || article.excerpt || "")
      const dzenFormattedContent = htmlToDzenFormat(article.content || article.excerpt || "")

      // Формируем медиа-контент для Яндекса
      let mediaContent = ""
      let enclosureContent = ""
      
      if (article.main_image) {
        const imageUrl = article.main_image.startsWith("http") 
          ? article.main_image 
          : `${baseUrl}${article.main_image.startsWith("/") ? "" : "/"}${article.main_image}`
        
        // Медиа-контент для Яндекса
        mediaContent = `
      <media:group>
        <media:content url="${escapeXml(imageUrl)}" type="image/jpeg"/>
        <media:thumbnail url="${escapeXml(imageUrl)}"/>
      </media:group>`

        // Enclosure для Дзена (обложка) - минимальная ширина 700px
        enclosureContent = `
      <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg"/>`

        // Добавляем изображение в контент для Дзена
        if (!dzenFormattedContent.includes('<img')) {
          const imageInContent = `
      <figure>
        <img src="${escapeXml(imageUrl)}" alt="${escapeXml(article.title || '')}"/>
        <figcaption>Иллюстрация: ${escapeXml(article.title || '')}</figcaption>
      </figure>`
        }
      }

      // Определяем категории для Дзена
      const dzenCategories = [
        'format-article', // или 'format-post' для постов
        'index', // или 'noindex'
        'comment-all' // или 'comment-subscribers', 'comment-none'
      ].map(cat => `      <category>${cat}</category>`).join('\n')

      return `    <item>
      <title>${escapeXml(article.title || "")}</title>
      <link>${escapeXml(articleUrl)}</link>
      <description>${escapeXml(beautifulExcerpt)}</description>
      <author>${escapeXml(article.author || "ООО АСТС")}</author>
      <category>${escapeXml(article.category || "Статьи")}</category>
      <pubDate>${pubDateDzen}</pubDate>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <!-- Яндекс специфичные теги -->
      <yandex:genre>article</yandex:genre>
      <yandex:full-text>${escapeXml(beautifulFullText)}</yandex:full-text>${mediaContent}
      <!-- Дзен специфичные теги -->
      <pdalink>${escapeXml(articleUrl)}</pdalink>${enclosureContent}
${dzenCategories}
      <content:encoded><![CDATA[${dzenFormattedContent}]]></content:encoded>
    </item>`
    }).join("\n") || ""

    // Собираем полный RSS-фид с поддержкой обеих платформ
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:yandex="http://news.yandex.ru" 
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
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
