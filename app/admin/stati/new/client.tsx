"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  ImageIcon,
  Tag,
  User,
  Calendar,
  Eye,
  EyeOff,
  Save,
  X,
  Bold,
  Italic,
  List,
  LinkIcon,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createArticle } from "@/app/actions/create-article"
import { verifyAdminPassword } from "@/app/actions/verify-admin-password"

export default function ArticleFormClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
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

  // Check if already authenticated
  useEffect(() => {
    const auth = sessionStorage.getItem("admin_authenticated")
    if (auth === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      const translitMap: { [key: string]: string } = {
        а: "a",
        б: "b",
        в: "v",
        г: "g",
        д: "d",
        е: "e",
        ё: "yo",
        ж: "zh",
        з: "z",
        и: "i",
        й: "y",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "h",
        ц: "ts",
        ч: "ch",
        ш: "sh",
        щ: "sch",
        ъ: "",
        ы: "y",
        ь: "",
        э: "e",
        ю: "yu",
        я: "ya",
      }

      const generatedSlug = title
        .toLowerCase()
        .split("")
        .map((char) => translitMap[char] || char)
        .join("")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      setSlug(generatedSlug)
    }
  }, [title, slug])

  // Auto-generate meta fields
  useEffect(() => {
    if (title && !metaTitle) {
      setMetaTitle(title)
    }
  }, [title, metaTitle])

  useEffect(() => {
    if (excerpt && !metaDescription) {
      setMetaDescription(excerpt)
    }
  }, [excerpt, metaDescription])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setMessage(null)

    try {
      const result = await verifyAdminPassword(password)

      if (result.success) {
        setIsAuthenticated(true)
        sessionStorage.setItem("admin_authenticated", "true")
        setMessage({ type: "success", text: "Вход выполнен успешно" })
      } else {
        setMessage({ type: "error", text: result.error || "Неверный пароль" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка при проверке пароля" })
    } finally {
      setIsVerifying(false)
    }
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
        newText = `<h1>${selectedText || "Заголовок 1"}</h1>`
        break
      case "h2":
        newText = `<h2>${selectedText || "Заголовок 2"}</h2>`
        break
      case "h3":
        newText = `<h3>${selectedText || "Заголовок 3"}</h3>`
        break
      case "ul":
        newText = `<ul>\n  <li>${selectedText || "Пункт списка"}</li>\n</ul>`
        break
      case "link":
        newText = `<a href="https://example.com">${selectedText || "текст ссылки"}</a>`
        break
      case "image":
        newText = `<img src="/images/example.jpg" alt="${selectedText || "описание изображения"}" class="w-full rounded-lg my-4" />`
        break
    }

    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("slug", slug)
      formData.append("excerpt", excerpt)
      formData.append("content", content)
      formData.append("main_image", mainImage)
      formData.append("author", author)
      formData.append("category", category)
      formData.append("tags", tags)
      formData.append("status", status)
      formData.append("featured", featured.toString())
      formData.append("meta_title", metaTitle)
      formData.append("meta_description", metaDescription)

      const result = await createArticle(formData)

      if (result.success) {
        setMessage({ type: "success", text: "Статья успешно создана!" })
        // Reset form
        setTitle("")
        setSlug("")
        setExcerpt("")
        setContent("")
        setMainImage("")
        setTags("")
        setMetaTitle("")
        setMetaDescription("")
      } else {
        setMessage({ type: "error", text: result.error || "Ошибка при создании статьи" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Произошла ошибка при отправке формы" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-blue-100">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Вход в админ панель</h1>
                <p className="text-gray-600">Введите пароль для доступа к форме создания статей</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="password">Пароль</Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Введите пароль"
                      className="pr-10"
                      required
                      disabled={isVerifying}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {message && (
                  <div
                    className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                  >
                    {message.text}
                  </div>
                )}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isVerifying}>
                  {isVerifying ? "Проверка..." : "Войти"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Создать новую статью</h1>
            <p className="text-gray-600">Заполните форму для публикации статьи на сайте</p>
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
                      <p className="text-sm text-gray-500 mt-1">Автоматически генерируется из заголовка</p>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <Label htmlFor="excerpt">Краткое описание *</Label>
                      <Textarea
                        id="excerpt"
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="Краткое описание статьи (отображается в превью)"
                        rows={3}
                        className="mt-2"
                        required
                      />
                    </div>

                    {/* Content Editor */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="content">Содержание статьи *</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                          {previewMode ? "Редактировать" : "Предпросмотр"}
                        </Button>
                      </div>

                      {/* Formatting Toolbar */}
                      {!previewMode && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border mb-2">
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
                            title="Список"
                          >
                            <List className="w-4 h-4" />
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
                        </div>
                      )}

                      {previewMode ? (
                        <div
                          className="prose max-w-none p-6 bg-white rounded-lg border min-h-[400px]"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      ) : (
                        <Textarea
                          id="content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Содержание статьи (поддерживается HTML)"
                          rows={20}
                          className="font-mono text-sm"
                          required
                        />
                      )}
                      <p className="text-sm text-gray-500 mt-1">Используйте HTML теги для форматирования текста</p>
                    </div>
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
                          className="w-full rounded-lg border"
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
                className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
              >
                {message.text}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-lg py-6"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSubmitting ? "Сохранение..." : "Опубликовать статью"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (confirm("Вы уверены? Все несохраненные данные будут потеряны.")) {
                    window.location.href = "/stati"
                  }
                }}
                className="px-6"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
