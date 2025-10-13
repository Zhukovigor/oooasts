"use server"

import { createClient } from "@/lib/supabase/server"

function formatContentToHtml(content: string): string {
  // If content already has HTML tags, return as is
  if (content.includes("<p>") || content.includes("<div>") || content.includes("<h1>")) {
    // Still process line breaks that might be outside of HTML tags
    return content.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")
  }

  // Split content by double line breaks (paragraphs)
  const paragraphs = content.split(/\n\n+/)

  // Wrap each paragraph in <p> tags and convert single line breaks to <br>
  const formattedParagraphs = paragraphs
    .map((paragraph) => {
      // Skip empty paragraphs
      if (!paragraph.trim()) return ""

      // Convert single line breaks within paragraphs to <br>
      const formattedParagraph = paragraph.trim().replace(/\n/g, "<br>")

      // Wrap in <p> tags
      return `<p>${formattedParagraph}</p>`
    })
    .filter((p) => p.length > 0)

  return formattedParagraphs.join("\n")
}

export async function createArticle(formData: FormData) {
  try {
    const supabase = await createClient()

    const title = formData.get("title") as string
    const slug = formData.get("slug") as string
    const excerpt = formData.get("excerpt") as string
    const rawContent = formData.get("content") as string
    const mainImage = formData.get("main_image") as string
    const author = formData.get("author") as string
    const category = formData.get("category") as string
    const tagsString = formData.get("tags") as string
    const status = formData.get("status") as string
    const featured = formData.get("featured") === "true"
    const metaTitle = formData.get("meta_title") as string
    const metaDescription = formData.get("meta_description") as string

    const content = formatContentToHtml(rawContent)

    // Parse tags
    const tags = tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = content.split(/\s+/).length
    const readTime = Math.ceil(wordCount / 200)

    const { data, error } = await supabase
      .from("articles")
      .insert({
        title,
        slug,
        excerpt,
        content,
        main_image: mainImage,
        author,
        category,
        tags,
        status,
        featured,
        meta_title: metaTitle || title,
        meta_description: metaDescription || excerpt,
        read_time: readTime,
        views: 0,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating article:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in createArticle:", error)
    return { success: false, error: "Произошла ошибка при создании статьи" }
  }
}
