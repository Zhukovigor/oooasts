import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Revalidate every hour
export const revalidate = 3600

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// Helper function to strip HTML tags from content
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch published articles, ordered by publication date
    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching articles:", error)
      return new NextResponse("Error fetching articles", { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts.vercel.app"

    // Generate RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:yandex="http://news.yandex.ru" 
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml("ООО «АСТС» - Статьи и новости")}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml("Актуальные статьи и новости о спецтехнике, экскаваторах, автобетононасосах и строительном оборудовании от компании АСТС")}</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${articles
  ?.map((article) => {
    const articleUrl = `${baseUrl}/stati/${article.slug}`
    const pubDate = new Date(article.published_at).toUTCString()

    // Clean content for full-text (remove HTML tags)
    const fullText = article.content ? stripHtml(article.content) : article.excerpt || ""

    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(articleUrl)}</link>
      <description>${escapeXml(article.excerpt || "")}</description>
      <author>${escapeXml(article.author || "ООО «АСТС»")}</author>
      <category>${escapeXml(article.category || "Статьи")}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <yandex:genre>message</yandex:genre>
      <yandex:full-text>${escapeXml(fullText)}</yandex:full-text>${
        article.main_image
          ? `
      <media:group>
        <media:content url="${escapeXml(article.main_image.startsWith("http") ? article.main_image : `${baseUrl}${article.main_image}`)}" type="image/jpeg"/>
        <media:thumbnail url="${escapeXml(article.main_image.startsWith("http") ? article.main_image : `${baseUrl}${article.main_image}`)}"/>
      </media:group>`
          : ""
      }
    </item>`
  })
  .join("\n")}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    })
  } catch (error) {
    console.error("Error generating RSS feed:", error)
    return new NextResponse("Error generating RSS feed", { status: 500 })
  }
}
