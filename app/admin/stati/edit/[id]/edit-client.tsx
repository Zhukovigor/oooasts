"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  FileText,
  ImageIcon,
  Tag,
  User,
  Calendar,
  Save,
  X,
  Bold,
  Italic,
  List,
  LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ArticleEditClientProps {
  articleId: string
}

export default function ArticleEditClient({ articleId }: ArticleEditClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  // Form fields
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [mainImage, setMainImage] = useState("")
  const [author, setAuthor] = useState("ООО АСТС")
  const [category, setCategory] = useState("Спецтехника")
  const [tags, setTags] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("published")
  const [featured, setFeatured] = useState(false)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")

  useEffect(() => {
    fetchArticle()
  }, [articleId])

  async function fetchArticle() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const { data, error } = await supabase.from("articles").select("*").eq("id", articleId).single()

      if (error) throw error

      if (data) {
        setTitle(data.title || "")
        setSlug(data.slug || "")
        setExcerpt(data.excerpt || "")
        setContent(data.content || "")
        setMainImage(data.main_image || "")
        setAuthor(data.author || "ООО АСТС")
        setCategory(data.category || "Спецтехника")
        setTags(data.tags?.join(", ") || "")
        setStatus(data.status || "published")
        setFeatured(data.featured || false)
        setMetaTitle(data.meta_title || "")
        setMetaDescription(data.meta_description || "")
      }
    } catch (error) {
      console.error("Error fetching article:", error)
      setMessage({ type: "error", text: "Ошибка при загрузке статьи" })
    } finally {
      setLoading(false)
    }
  }

  // Функция для санитизации HTML контента
  const sanitizeHtml = (html: string): string => {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/&lt;(strong|em|h1|h2|h3|ul|ol|li|a|img|p|br)(.*?)&gt;/g, '<$1$2>')
      .replace(/&lt;\/(strong|em|h1|h2|h3|ul|ol|li|a|img|p)&gt;/g, '</$1>')
  }

  // Функция для форматирования контента в предпросмотре
  const formatPreviewContent = (html: string): string => {
    const sanitized = sanitizeHtml(html)
    
    // Добавляем базовые стили для улучшения отображения
    return `
      <div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6;">
        ${sanitized}
      </div>
    `
  }

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById("content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    let newText = ""

    switch (format) {
      case "bold":
        newText = `<strong>${selectedText || "жирный текст"}</strong>`
        break
      case "italic":
        newText = `<em>${selectedText || "курсив"}</em>`
        break
      case "h1":
        newText = `\n<h1>${selectedText || "Заголовок 1"}</h1>\n`
        break
      case "h2":
        newText = `\n<h2>${selectedText || "Заголовок 2"}</h2>\n`
        break
      case "h3":
        newText = `\n<h3>${selectedText || "Заголовок 3"}</h3>\n`
        break
      case "ul":
        if (selectedText) {
          const items = selectedText.split('\n').filter(item => item.trim())
          newText = `\n<ul>\n${items.map(item => `  <li>${item.trim()}</li>`).join('\n')}\n</ul>\n`
        } else {
          newText = `\n<ul>\n  <li>Пункт списка</li>\n</ul>\n`
        }
        break
      case "ol":
        if (selectedText) {
          const items = selectedText.split('\n').filter(item => item.trim())
          newText = `\n<ol>\n${items.map(item => `  <li>${item.trim()}</li>`).join('\n')}\n</ol>\n`
        } else {
          newText = `\n<ol>\n  <li>Пункт списка</li>\n</ol>\n`
        }
        break
      case "link":
        newText = `<a href="https://example.com" target="_blank" rel="noopener noreferrer">${selectedText || "текст ссылки"}</a>`
        break
      case "image":
        newText = `\n<img src="/images/example.jpg" alt="${selectedText || "описание изображения"}" style="width: 100%; border-radius: 0.5rem; margin: 1rem 0;" />\n`
        break
      case "br":
        newText = `<br>`
        break
      case "paragraph":
        newText = `\n<p>${selectedText || "Новый параграф"}</p>\n`
        break
      default:
        return
    }

    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)

    setTimeout(() => {
      textarea.focus()
      const newPosition = start + newText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  // Функция для автоматического форматирования контента при сохранении
  const formatContentForSave = (html: string): string => {
    return html
      .replace(/\n/g, '')
      .replace(/<br>/g, '\n')
      .replace(/>\s+</g, '><')
      .trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const formattedContent = formatContentForSave(content)

      const { error } = await supabase
        .from("articles")
        .update({
          title,
          slug,
          excerpt,
          content: formattedContent,
          main_image: mainImage,
          author,
          category,
          tags: tagsArray,
          status,
          featured,
          meta_title: metaTitle,
          meta_description: metaDescription,
          updated_at: new Date().toISOString(),
        })
        .eq("id", articleId)

      if (error) throw error

      setMessage({ type: "success", text: "Статья успешно обновлена!" })
      setTimeout(() => {
        router.push("/admin/stati")
      }, 1500)
    } catch (error) {
      console.error("Error updating article:", error)
      setMessage({ type: "error", text: "Ошибка при обновлении статьи" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/stati">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Редактировать статью</h1>
          <p className="text-gray-600 mt-1">Внесите изменения и сохраните</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-blue-100">
              <CardContent className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Заголовок статьи *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Введите заголовок статьи"
                    className="mt-2"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <Label htmlFor="slug">URL (slug) *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-statii"
                    className="mt-2"
                    required
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <Label htmlFor="excerpt">Краткое описание *</Label>
                  <Textarea
                    id="excerpt"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Краткое описание статьи"
                    rows={3}
                    className="mt-2"
                    required
                  />
                </div>

                {/* Content Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content" className="text-lg font-semibold">
                      Содержание статьи *
                    </Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                      {previewMode ? "Редактировать" : "Предпросмотр"}
                    </Button>
                  </div>

                  {/* Formatting Toolbar */}
                  {!previewMode && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("bold")}
                        title="Жирный текст"
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("italic")}
                        title="Курсив"
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("h1")}
                        title="Заголовок 1"
                      >
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("h2")}
                        title="Заголовок 2"
                      >
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("h3")}
                        title="Заголовок 3"
                      >
                        <Heading3 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("ul")}
                        title="Маркированный список"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("ol")}
                        title="Нумерованный список"
                      >
                        1.
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("link")}
                        title="Ссылка"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("image")}
                        title="Изображение"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertFormatting("br")}
                        title="Перенос строки"
                      >
                        ↵
                      </Button>
                    </div>
                  )}

                  {previewMode ? (
                    <div
                      className="p-6 bg-white rounded-lg border min-h-[400px] prose max-w-none"
                      style={{ 
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: formatPreviewContent(content) || "<p style='color: #666;'>Контент отсутствует</p>" 
                      }}
                    />
                  ) : (
                    <div className="relative">
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Содержание статьи (поддерживается HTML). Используйте кнопки выше для форматирования."
                        rows={20}
                        className="font-mono text-sm whitespace-pre-wrap resize-vertical"
                        required
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                        {content.length} символов
                      </div>
                    </div>
                  )}
                </div>

                {/* Инструкция по форматированию */}
                {!previewMode && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Инструкция по форматированию:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Выделите текст и нажмите кнопку для форматирования</li>
                      <li>Для списков: выделите несколько строк текста или оставьте пустым для шаблона</li>
                      <li>Переносы строк сохраняются автоматически</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Settings */}
            <Card className="border-2 border-blue-100">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-gray-900">Настройки публикации</h3>

                <div>
                  <Label htmlFor="status">Статус</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                    className="w-full mt-2 px-3 py-2 border rounded-lg"
                  >
                    <option value="published">Опубликовано</option>
                    <option value="draft">Черновик</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    Избранная статья
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Image */}
            <Card className="border-2 border-blue-100">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Главное изображение
                </h3>

                <div>
                  <Label htmlFor="mainImage">URL изображения *</Label>
                  <Input
                    id="mainImage"
                    value={mainImage}
                    onChange={(e) => setMainImage(e.target.value)}
                    placeholder="/images/article.jpg"
                    className="mt-2"
                    required
                  />
                </div>

                {mainImage && (
                  <div className="mt-2">
                    <img
                      src={mainImage || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full rounded-lg border max-h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=200&width=400"
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="border-2 border-blue-100">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-gray-900">Метаданные</h3>

                <div>
                  <Label htmlFor="author" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Автор
                  </Label>
                  <Input
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="ООО АСТС"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Категория *
                  </Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="Спецтехника">Спецтехника</option>
                    <option value="Новости">Новости</option>
                    <option value="Обзоры">Обзоры</option>
                    <option value="Советы">Советы</option>
                    <option value="Лизинг">Лизинг</option>
                    <option value="Техническое обслуживание">Техническое обслуживание</option>
                    <option value="Автобетононасосы">Автобетононасосы</option>
                    <option value="Экскаваторы">Экскаваторы</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="tags" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Теги
                  </Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="экскаваторы, komatsu, спецтехника"
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">Разделяйте запятыми</p>
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="border-2 border-blue-100">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-gray-900">SEO</h3>

                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Заголовок для поисковиков"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Описание для поисковиков"
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
          >
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-lg py-6 transition-colors"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? "Сохранение..." : "Сохранить изменения"}
          </Button>
          <Link href="/admin/stati">
            <Button 
              type="button" 
              variant="outline" 
              className="px-6 py-6 bg-transparent border-gray-300 hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
