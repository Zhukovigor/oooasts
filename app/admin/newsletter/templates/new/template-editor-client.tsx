"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  Upload,
  Save,
  Eye,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Type,
  Trash2,
  Edit,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

interface SmtpAccount {
  id: string
  name: string
  email: string
}

interface Attachment {
  name: string
  url: string
  size: number
  type: string
}

interface EmailTemplate {
  id?: string
  name: string
  subject: string
  from_name: string
  from_email: string
  reply_to: string
  html_content: string
  styles: {
    backgroundColor: string
    textColor: string
    primaryColor: string
    fontFamily: string
    fontSize: string
    buttonColor: string
    buttonTextColor: string
  }
  attachments?: Attachment[]
}

interface Props {
  smtpAccounts: SmtpAccount[]
  templateId?: string
}

export default function TemplateEditorClient({ smtpAccounts, templateId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(!!templateId)

  const [template, setTemplate] = useState<EmailTemplate>({
    name: "",
    subject: "",
    from_name: "ООО АСТС",
    from_email: smtpAccounts[0]?.email || "",
    reply_to: "",
    html_content: "",
    styles: {
      backgroundColor: "#ffffff",
      textColor: "#333333",
      primaryColor: "#2563eb",
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      buttonColor: "#2563eb",
      buttonTextColor: "#ffffff",
    },
    attachments: [],
  })

  const [newAttachments, setNewAttachments] = useState<File[]>([])
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([])

  const [showButtonDialog, setShowButtonDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [buttonText, setButtonText] = useState("Нажмите здесь")
  const [buttonUrl, setButtonUrl] = useState("https://")
  const [linkText, setLinkText] = useState("")
  const [linkUrl, setLinkUrl] = useState("https://")
  const [textColor, setTextColor] = useState("#333333")

  const savedSelection = useRef<Range | null>(null)

  // Загрузка шаблона при редактировании
  useEffect(() => {
    if (templateId) {
      loadTemplate()
    }
  }, [templateId])

  const loadTemplate = async () => {
    if (!templateId) return

    setLoading(true)
    const supabase = createBrowserClient()

    try {
      const { data: templateData, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", templateId)
        .single()

      if (error) throw error

      if (templateData) {
        // Преобразуем строки JSON в объекты
        const styles = typeof templateData.styles === 'string' 
          ? JSON.parse(templateData.styles) 
          : templateData.styles
        
        const attachments = typeof templateData.attachments === 'string'
          ? JSON.parse(templateData.attachments)
          : templateData.attachments

        setTemplate({
          ...templateData,
          styles,
          attachments: attachments || [],
        })

        // Устанавливаем содержимое редактора
        setTimeout(() => {
          if (editorRef.current && templateData.html_content) {
            editorRef.current.innerHTML = templateData.html_content
          }
        }, 100)
      }
    } catch (error) {
      console.error("[DEBUG] Error loading template:", error)
      alert("Ошибка при загрузке шаблона")
    } finally {
      setLoading(false)
    }
  }

  const saveCursorPosition = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedSelection.current = selection.getRangeAt(0)
    }
  }

  const restoreCursorPosition = () => {
    if (savedSelection.current && editorRef.current) {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(savedSelection.current)
      }
      editorRef.current.focus()
    }
  }

  const applyFormat = (command: string, value?: string) => {
    saveCursorPosition()
    document.execCommand(command, false, value)
    updateContent()
    restoreCursorPosition()
  }

  const updateContent = () => {
    if (editorRef.current) {
      setTemplate({ ...template, html_content: editorRef.current.innerHTML })
    }
  }

  const insertButton = () => {
    saveCursorPosition()
    setShowButtonDialog(true)
  }

  const handleInsertButton = () => {
    restoreCursorPosition()

    const buttonHtml = `
      <table cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;">
        <tr>
          <td style="border-radius: 6px; background-color: ${template.styles.buttonColor};">
            <a href="${buttonUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; color: ${template.styles.buttonTextColor}; text-decoration: none; font-weight: bold; font-family: Arial, sans-serif;">${buttonText}</a>
          </td>
        </tr>
      </table>
    `

    document.execCommand("insertHTML", false, buttonHtml)
    updateContent()

    setShowButtonDialog(false)
    setButtonText("Нажмите здесь")
    setButtonUrl("https://")
  }

  const insertLink = () => {
    saveCursorPosition()
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      setLinkText(selection.toString())
    }
    setShowLinkDialog(true)
  }

  const handleInsertLink = () => {
    restoreCursorPosition()

    const linkHtml = `<a href="${linkUrl}" style="color: ${template.styles.primaryColor}; text-decoration: underline;">${linkText || linkUrl}</a>`
    document.execCommand("insertHTML", false, linkHtml)
    updateContent()

    setShowLinkDialog(false)
    setLinkText("")
    setLinkUrl("https://")
  }

  const insertHeading = (level: number) => {
    applyFormat("formatBlock", `h${level}`)
  }

  const insertBlockquote = () => {
    applyFormat("formatBlock", "blockquote")
  }

  const insertHorizontalRule = () => {
    applyFormat("insertHorizontalRule")
  }

  const changeTextColor = (color: string) => {
    applyFormat("foreColor", color)
  }

  const insertImage = () => {
    const url = prompt("Введите URL изображения:")
    if (url) {
      const imgHtml = `<img src="${url}" style="max-width: 100%; height: auto; margin: 10px 0;" alt="Image" />`
      document.execCommand("insertHTML", false, imgHtml)
      updateContent()
    }
  }

  const checkBucketAccess = async (): Promise<boolean> => {
    const supabase = createBrowserClient()
    
    try {
      const { data, error } = await supabase.storage
        .from("email-attachments")
        .list()
      
      if (error) {
        console.error("❌ Bucket access error:", error)
        return false
      }
      
      console.log("✅ Bucket access OK, files count:", data?.length)
      return true
    } catch (error) {
      console.error("❌ Bucket check failed:", error)
      return false
    }
  }

  const uploadFilesToStorage = async (files: File[]): Promise<Attachment[]> => {
    const supabase = createBrowserClient()
    const uploaded: Attachment[] = []

    console.log("🔄 Starting file upload process...", { fileCount: files.length })

    // 🔴 ПРОВЕРКА АУТЕНТИФИКАЦИИ
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("❌ User not authenticated for file upload:", authError)
      throw new Error("Пользователь не авторизован для загрузки файлов")
    }

    console.log("✅ User authenticated for upload:", user.id)

    for (const file of files) {
      try {
        const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${file.name.split('.').pop()}`
        
        console.log("📤 Uploading file:", {
          name: file.name,
          size: file.size,
          type: file.type,
          storageName: fileName,
          user: user.id
        })

        // 🔴 УПРОЩЕННАЯ ЗАГРУЗКА
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("email-attachments")
          .upload(fileName, file) // Только обязательные параметры

        if (uploadError) {
          console.error("❌ STORAGE UPLOAD ERROR:", {
            message: uploadError.message,
            details: uploadError.details,
            statusCode: uploadError.statusCode
          })
          throw new Error(`Ошибка загрузки файла ${file.name}: ${uploadError.message}`)
        }

        console.log("✅ File uploaded to storage:", uploadData)

        // Получаем публичный URL
        const { data: { publicUrl } } = supabase.storage
          .from("email-attachments")
          .getPublicUrl(fileName)

        console.log("🔗 Public URL:", publicUrl)

        const attachment: Attachment = {
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
        }

        uploaded.push(attachment)
        console.log("📝 Attachment added:", attachment)

      } catch (error) {
        console.error("💥 CRITICAL UPLOAD ERROR:", error)
        throw error
      }
    }

    console.log("🎉 All files uploaded successfully:", uploaded)
    return uploaded
  }

  const deleteFilesFromStorage = async (urls: string[]) => {
    const supabase = createBrowserClient()
    
    const filesToDelete = urls.map(url => {
      const path = url.split('/').pop()
      return path
    }).filter(Boolean)

    if (filesToDelete.length > 0) {
      console.log("🗑️ Deleting files:", filesToDelete)
      const { error } = await supabase.storage
        .from("email-attachments")
        .remove(filesToDelete)
      
      if (error) {
        console.error("❌ Error deleting files:", error)
        throw error
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      console.log("🖱️ File input changed:", newFiles.map(f => ({ name: f.name, size: f.size, type: f.type })))

      // Проверяем типы файлов и размер
      const validFiles = newFiles.filter(file => {
        const validTypes = ['.pdf', '.doc', '.docx', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        const isValidType = validTypes.some(type => 
          file.name.toLowerCase().includes(type.replace('.', '')) || 
          file.type.includes(type)
        )
        
        if (!isValidType) {
          alert(`Файл ${file.name} имеет неподдерживаемый формат. Разрешены только PDF, DOC, DOCX.`)
          return false
        }
        
        if (file.size > 10 * 1024 * 1024) {
          alert(`Файл ${file.name} слишком большой. Максимальный размер 10MB.`)
          return false
        }
        
        return true
      })
      
      setNewAttachments(prev => [...prev, ...validFiles])
      console.log("✅ Valid files selected:", validFiles.map(f => ({ name: f.name, size: f.size })))
      
      // Сбрасываем значение input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingAttachment = (index: number) => {
    const attachment = template.attachments?.[index]
    if (attachment) {
      // Добавляем в список для удаления
      setAttachmentsToDelete(prev => [...prev, attachment.url])
      
      // Удаляем из текущего шаблона
      const updatedAttachments = template.attachments?.filter((_, i) => i !== index) || []
      setTemplate({
        ...template,
        attachments: updatedAttachments
      })
    }
  }

  const handleSave = async () => {
    if (!template.name || !template.subject) {
      alert("Заполните все обязательные поля")
      return
    }

    // Получаем финальное содержимое редактора
    const finalContent = editorRef.current?.innerHTML || template.html_content
    if (!finalContent || finalContent.trim() === "" || finalContent === "<br>") {
      alert("Содержание письма не может быть пустым")
      return
    }

    setLoading(true)
    const supabase = createBrowserClient()

    try {
      console.log("💾 Starting template save process...")

      // 🔴 ПРОВЕРКА АУТЕНТИФИКАЦИИ
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error("❌ User not authenticated:", authError)
        throw new Error("Пользователь не авторизован. Пожалуйста, войдите в систему.")
      }

      console.log("✅ User authenticated:", { id: user.id, email: user.email })

      // Проверяем доступность бакета
      const bucketAccess = await checkBucketAccess()
      if (!bucketAccess) {
        throw new Error("Нет доступа к хранилищу файлов. Проверьте настройки бакета.")
      }

      let newUploadedAttachments: Attachment[] = []

      // 🔴 ЗАГРУЗКА ФАЙЛОВ
      if (newAttachments.length > 0) {
        console.log("📎 Processing new attachments:", newAttachments.length)
        newUploadedAttachments = await uploadFilesToStorage(newAttachments)
        console.log("✅ New attachments uploaded:", newUploadedAttachments)
      } else {
        console.log("ℹ️ No new attachments to upload")
      }

      // Удаляем файлы если нужно
      if (attachmentsToDelete.length > 0) {
        console.log("🗑️ Deleting attachments:", attachmentsToDelete)
        await deleteFilesFromStorage(attachmentsToDelete)
      }

      // Объединяем вложения
      const existingAttachments = template.attachments?.filter(att => 
        !attachmentsToDelete.includes(att.url)
      ) || []

      const allAttachments = [...existingAttachments, ...newUploadedAttachments]

      console.log("📋 Final attachments list:", allAttachments)

      const templateData = {
        name: template.name,
        subject: template.subject,
        from_name: template.from_name,
        from_email: template.from_email,
        reply_to: template.reply_to,
        html_content: finalContent,
        styles: template.styles,
        attachments: allAttachments, // 🔴 ВАЖНО: attachments ДОЛЖНЫ БЫТЬ ЗДЕСЬ
        is_active: true,
      }

      console.log("💿 Saving template to database:", templateData)

      let result
      if (isEditing && templateId) {
        result = await supabase
          .from("email_templates")
          .update(templateData)
          .eq("id", templateId)
          .select()
      } else {
        result = await supabase
          .from("email_templates")
          .insert(templateData)
          .select()
      }

      if (result.error) {
        console.error("❌ DATABASE ERROR:", result.error)
        throw result.error
      }

      console.log("✅ Template saved successfully:", result.data)
      alert(`Шаблон успешно ${isEditing ? 'обновлен' : 'сохранен'}!`)
      router.push("/admin/newsletter")
      
    } catch (error: any) {
      console.error("💥 SAVE PROCESS FAILED:", error)
      alert(`Ошибка при сохранении: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const generatePreviewHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: ${template.styles.fontFamily};
              font-size: ${template.styles.fontSize};
              color: ${template.styles.textColor};
              background-color: ${template.styles.backgroundColor};
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${template.html_content}
          </div>
        </body>
      </html>
    `
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const inputEvent = {
        target: { files: e.dataTransfer.files }
      } as React.ChangeEvent<HTMLInputElement>
      handleFileUpload(inputEvent)
    }
  }

  const allAttachmentsCount = (template.attachments?.length || 0) + newAttachments.length

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Редактировать шаблон письма' : 'Создать шаблон письма'}
          </h1>
          <p className="text-gray-600">Настройте дизайн и содержание email рассылки</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Редактор" : "Предпросмотр"}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {isEditing ? <Edit className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {loading ? "Сохранение..." : (isEditing ? "Обновить" : "Сохранить")}
          </Button>
        </div>
      </div>

      {loading && !isEditing ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка шаблона...</p>
          </div>
        </div>
      ) : showPreview ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Предпросмотр письма</h2>
          <div className="border rounded-lg p-4 bg-white">
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-gray-600">
                От: {template.from_name} &lt;{template.from_email}&gt;
              </p>
              <p className="text-sm text-gray-600">Тема: {template.subject}</p>
              {allAttachmentsCount > 0 && (
                <p className="text-sm text-gray-600">
                  Вложения: {allAttachmentsCount} файл(ов)
                </p>
              )}
            </div>
            <iframe 
              srcDoc={generatePreviewHtml()} 
              className="w-full h-[600px] border-0 rounded" 
              title="Email Preview" 
            />
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Содержание</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="style">Стиль</TabsTrigger>
            <TabsTrigger value="attachments">Вложения ({allAttachmentsCount})</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Название шаблона *</Label>
                  <Input
                    id="template-name"
                    value={template.name}
                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    placeholder="Например: Рекламная рассылка"
                  />
                </div>

                <div>
                  <Label htmlFor="template-subject">Тема письма *</Label>
                  <Input
                    id="template-subject"
                    value={template.subject}
                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                    placeholder="Специальное предложение на спецтехнику"
                  />
                </div>

                <div>
                  <Label>Содержание письма *</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("bold")} title="Жирный">
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("italic")} title="Курсив">
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("underline")} title="Подчеркнутый">
                        <Underline className="w-4 h-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertHeading(1)} title="Заголовок 1">
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertHeading(2)} title="Заголовок 2">
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertHeading(3)} title="Заголовок 3">
                        <Heading3 className="w-4 h-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("justifyLeft")} title="По левому краю">
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("justifyCenter")} title="По центру">
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("justifyRight")} title="По правому краю">
                        <AlignRight className="w-4 h-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("insertUnorderedList")} title="Маркированный список">
                        <List className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("insertOrderedList")} title="Нумерованный список">
                        <ListOrdered className="w-4 h-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={insertBlockquote} title="Цитата">
                        <Quote className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={insertHorizontalRule} title="Горизонтальная линия">
                        <Minus className="w-4 h-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <div className="flex items-center gap-1">
                        <Type className="w-4 h-4 text-gray-600" />
                        <Input
                          type="color"
                          value={textColor}
                          onChange={(e) => {
                            setTextColor(e.target.value)
                            changeTextColor(e.target.value)
                          }}
                          className="w-12 h-8 p-1 cursor-pointer"
                          title="Цвет текста"
                        />
                      </div>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={insertLink} title="Вставить ссылку">
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={insertButton} title="Вставить кнопку">
                        Кнопка
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={insertImage} title="Вставить изображение">
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <select
                        className="px-2 py-1 border rounded text-sm"
                        onChange={(e) => applyFormat("fontSize", e.target.value)}
                        title="Размер шрифта"
                      >
                        <option value="">Размер</option>
                        <option value="1">Очень маленький</option>
                        <option value="2">Маленький</option>
                        <option value="3">Обычный</option>
                        <option value="4">Средний</option>
                        <option value="5">Большой</option>
                        <option value="6">Очень большой</option>
                        <option value="7">Огромный</option>
                      </select>
                    </div>

                    {/* Editor */}
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={updateContent}
                      className="min-h-[400px] p-4 focus:outline-none prose max-w-none"
                      style={{
                        fontFamily: template.styles.fontFamily,
                        fontSize: template.styles.fontSize,
                        color: template.styles.textColor,
                        backgroundColor: template.styles.backgroundColor,
                      }}
                      suppressContentEditableWarning
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="from-name">Имя отправителя</Label>
                  <Input
                    id="from-name"
                    value={template.from_name}
                    onChange={(e) => setTemplate({ ...template, from_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="from-email">Email отправителя *</Label>
                  <select
                    id="from-email"
                    className="w-full px-3 py-2 border rounded-md"
                    value={template.from_email}
                    onChange={(e) => setTemplate({ ...template, from_email: e.target.value })}
                  >
                    {smtpAccounts.map((account) => (
                      <option key={account.id} value={account.email}>
                        {account.name} ({account.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="reply-to">Email для ответов</Label>
                  <Input
                    id="reply-to"
                    type="email"
                    value={template.reply_to}
                    onChange={(e) => setTemplate({ ...template, reply_to: e.target.value })}
                    placeholder="reply@example.com"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="style" className="space-y-4">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Цвет фона</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={template.styles.backgroundColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, backgroundColor: e.target.value },
                        })
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={template.styles.backgroundColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, backgroundColor: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Цвет текста</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={template.styles.textColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, textColor: e.target.value },
                        })
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={template.styles.textColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, textColor: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Цвет кнопок</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={template.styles.buttonColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, buttonColor: e.target.value },
                        })
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={template.styles.buttonColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, buttonColor: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Цвет текста кнопок</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={template.styles.buttonTextColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, buttonTextColor: e.target.value },
                        })
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={template.styles.buttonTextColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, buttonTextColor: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="font-family">Шрифт</Label>
                  <select
                    id="font-family"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={template.styles.fontFamily}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        styles: { ...template.styles, fontFamily: e.target.value },
                      })
                    }
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="font-size">Размер шрифта</Label>
                  <select
                    id="font-size"
                    className="w-full px-3 py-2 border rounded-md mt-1"
                    value={template.styles.fontSize}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        styles: { ...template.styles, fontSize: e.target.value },
                      })
                    }
                  >
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="22px">22px</option>
                  </select>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <Label>Прикрепить файлы (PDF, DOC, DOCX)</Label>
                  <div 
                    className="mt-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <label className="flex flex-col items-center justify-center w-full h-32 cursor-pointer">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Нажмите для выбора файлов или перетащите их сюда</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX до 10MB</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple                    
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  
                  {/* Информация о выбранных файлах */}
                  {newAttachments.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Новые файлы для загрузки: <strong>{newAttachments.length}</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Файлы будут загружены при сохранении шаблона
                      </p>
                    </div>
                  )}
                </div>

                {/* Существующие вложения */}
                {template.attachments && template.attachments.length > 0 && (
                  <div>
                    <Label>Существующие вложения:</Label>
                    <div className="mt-3 space-y-3">
                      {template.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-white rounded">
                              <Upload className="w-4 h-4 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(attachment.size / 1024).toFixed(1)} KB • {attachment.type || "Неизвестный тип"}
                              </p>
                              <a 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Открыть файл
                              </a>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingAttachment(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Новые вложения */}
                {newAttachments.length > 0 && (
                  <div>
                    <Label>Новые вложения:</Label>
                    <div className="mt-3 space-y-3">
                      {newAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-white rounded">
                              <Upload className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB • {file.type || "Неизвестный тип"}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNewAttachment(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {allAttachmentsCount === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Файлы не добавлены</p>
                    <p className="text-sm mt-1">Добавьте PDF, DOC или DOCX файлы для прикрепления к письму</p>
                  </div>
                )}

                {/* Общая статистика */}
                {allAttachmentsCount > 0 && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-600">
                      <strong>Всего файлов:</strong> {allAttachmentsCount} • 
                      <strong> Существующие:</strong> {template.attachments?.length || 0} •
                      <strong> Новые:</strong> {newAttachments.length} •
                      {attachmentsToDelete.length > 0 && <span> <strong>На удаление:</strong> {attachmentsToDelete.length}</span>}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Диалоги */}
      <Dialog open={showButtonDialog} onOpenChange={setShowButtonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить кнопку</DialogTitle>
            <DialogDescription>Настройте текст и ссылку для кнопки</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="button-text">Текст кнопки</Label>
              <Input
                id="button-text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Нажмите здесь"
              />
            </div>
            <div>
              <Label htmlFor="button-url">Ссылка (URL)</Label>
              <Input
                id="button-url"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Предпросмотр:</p>
              <div className="flex justify-center">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    backgroundColor: template.styles.buttonColor,
                    color: template.styles.buttonTextColor,
                    textDecoration: "none",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {buttonText}
                </a>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowButtonDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleInsertButton}>Вставить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить ссылку</DialogTitle>
            <DialogDescription>Добавьте текст и URL для ссылки</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="link-text">Текст ссылки</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Текст ссылки"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Предпросмотр:</p>
              <a 
                href="#" 
                onClick={(e) => e.preventDefault()}
                style={{ color: template.styles.primaryColor, textDecoration: 'underline' }}
                className="text-sm"
              >
                {linkText || linkUrl}
              </a>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleInsertLink}>Вставить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
