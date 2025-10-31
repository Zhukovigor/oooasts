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

interface Props {
  smtpAccounts: SmtpAccount[]
}

export default function TemplateEditorClient({ smtpAccounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const contentInitialized = useRef(false)

  const [template, setTemplate] = useState({
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
  })

  const [attachments, setAttachments] = useState<File[]>([])

  const [showButtonDialog, setShowButtonDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [buttonText, setButtonText] = useState("Нажмите здесь")
  const [buttonUrl, setButtonUrl] = useState("https://")
  const [linkText, setLinkText] = useState("")
  const [linkUrl, setLinkUrl] = useState("https://")
  const [textColor, setTextColor] = useState("#333333")

  const savedSelection = useRef<Range | null>(null)

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

  useEffect(() => {
    if (editorRef.current && template.html_content && editorRef.current.innerHTML !== template.html_content) {
      editorRef.current.innerHTML = template.html_content
    }
  }, [template.html_content])

  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    updateContent()
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

    if (savedSelection.current && editorRef.current) {
      const range = savedSelection.current
      range.deleteContents()
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = buttonHtml
      const frag = document.createDocumentFragment()
      let node
      while ((node = tempDiv.firstChild)) {
        frag.appendChild(node)
      }
      range.insertNode(frag)
      updateContent()
    }

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

    if (savedSelection.current && editorRef.current) {
      const range = savedSelection.current
      range.deleteContents()
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = linkHtml
      const frag = document.createDocumentFragment()
      let node
      while ((node = tempDiv.firstChild)) {
        frag.appendChild(node)
      }
      range.insertNode(frag)
      updateContent()
    }

    setShowLinkDialog(false)
    setLinkText("")
    setLinkUrl("https://")
  }

  const insertHeading = (level: number) => {
    applyFormat("formatBlock", `h${level}`)
  }

  const insertBlockquote = () => {
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      const quoteHtml = `<blockquote style="border-left: 4px solid ${template.styles.primaryColor}; padding-left: 16px; margin: 16px 0; color: #666; font-style: italic;">${selection.toString()}</blockquote>`
      document.execCommand("insertHTML", false, quoteHtml)
      updateContent()
    }
  }

  const insertHorizontalRule = () => {
    document.execCommand("insertHorizontalRule", false)
    updateContent()
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments([...attachments, ...newFiles])
      console.log(
        "[v0] Files selected:",
        newFiles.map((f) => f.name),
      )
    }
  }

  const handleSave = async () => {
    if (!template.name || !template.subject) {
      alert("Заполните все обязательные поля")
      return
    }

    if (editorRef.current) {
      const finalContent = editorRef.current.innerHTML
      console.log("[v0] Final content length:", finalContent.length)
      console.log("[v0] Final content preview:", finalContent.substring(0, 500))

      if (!finalContent || finalContent.trim() === "") {
        alert("Содержание письма не может быть пустым")
        return
      }

      setTemplate({ ...template, html_content: finalContent })
    }

    setLoading(true)
    const supabase = createBrowserClient()

    try {
      const attachmentUrls = []

      for (const file of attachments) {
        const fileName = `${Date.now()}-${file.name}`
        console.log("[v0] Uploading file:", fileName)

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("email-attachments")
          .upload(fileName, file)

        if (uploadError) {
          console.error("[v0] Upload error:", uploadError)
          attachmentUrls.push({
            name: file.name,
            url: "",
            size: file.size,
            type: file.type,
          })
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("email-attachments").getPublicUrl(fileName)

        console.log("[v0] File uploaded successfully:", publicUrl)
        attachmentUrls.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
        })
      }

      console.log("[v0] Saving template with attachments:", attachmentUrls)

      const finalContent = editorRef.current?.innerHTML || template.html_content

      const { error } = await supabase.from("email_templates").insert({
        ...template,
        html_content: finalContent,
        attachments: attachmentUrls,
      })

      if (error) throw error

      alert("Шаблон успешно сохранен!")
      router.push("/admin/newsletter")
    } catch (error) {
      console.error("[v0] Error saving template:", error)
      alert("Ошибка при сохранении шаблона")
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
        </head>
        <body style="
          margin: 0;
          padding: 20px;
          font-family: ${template.styles.fontFamily};
          font-size: ${template.styles.fontSize};
          color: ${template.styles.textColor};
          background-color: ${template.styles.backgroundColor};
        ">
          <div style="max-width: 600px; margin: 0 auto;">
            ${template.html_content}
          </div>
        </body>
      </html>
    `
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Создать шаблон письма</h1>
          <p className="text-gray-600">Настройте дизайн и содержание email рассылки</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Редактор" : "Предпросмотр"}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      {showPreview ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Предпросмотр письма</h2>
          <div className="border rounded-lg p-4 bg-white">
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-gray-600">
                От: {template.from_name} &lt;{template.from_email}&gt;
              </p>
              <p className="text-sm text-gray-600">Тема: {template.subject}</p>
            </div>
            <iframe srcDoc={generatePreviewHtml()} className="w-full h-[600px] border-0" title="Email Preview" />
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="content" className="space-y-6">
          <TabsList>
            <TabsTrigger value="content">Содержание</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="style">Стиль</TabsTrigger>
            <TabsTrigger value="attachments">Вложения</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label>Название шаблона *</Label>
                  <Input
                    value={template.name}
                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    placeholder="Например: Рекламная рассылка"
                  />
                </div>

                <div>
                  <Label>Тема письма *</Label>
                  <Input
                    value={template.subject}
                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                    placeholder="Специальное предложение на спецтехнику"
                  />
                </div>

                <div>
                  <Label>Содержание письма *</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
                      {/* Text formatting */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat("bold")}
                        title="Жирный"
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat("italic")}
                        title="Курсив"
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat("underline")}
                        title="Подчеркнутый"
                      >
                        <Underline className="w-4 h-4" />
                      </Button>

                      <div className="w-px bg-gray-300 mx-1" />

                      {/* Headings */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHeading(1)}
                        title="Заголовок 1"
                      >
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHeading(2)}
                        title="Заголовок 2"
                      >
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertHeading(3)}
                        title="Заголовок 3"
                      >
                        <Heading3 className="w-4 h-4" />
                      </Button>

                      <div className="w-px bg-gray-300 mx-1" />

                      {/* Alignment */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat("justifyLeft")}
                        title="По левому краю"
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat("justifyCenter")}
                        title="По центру"
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat("justifyRight")}
                        title="По правому краю"
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>

                      <div className="w-px bg-gray-300 mx-1" />

                      {/* Lists */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat("insertUnorderedList")}
                        title="Маркированный список"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => applyFormat("insertOrderedList")}
                        title="Нумерованный список"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </Button>

                      <div className="w-px bg-gray-300 mx-1" />

                      {/* Quote and HR */}
                      <Button type="button" variant="ghost" size="sm" onClick={insertBlockquote} title="Цитата">
                        <Quote className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={insertHorizontalRule}
                        title="Горизонтальная линия"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>

                      <div className="w-px bg-gray-300 mx-1" />

                      {/* Text color */}
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

                      {/* Insert elements */}
                      <Button type="button" variant="ghost" size="sm" onClick={insertLink} title="Вставить ссылку">
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={insertButton} title="Вставить кнопку">
                        Кнопка
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={insertImage}
                        title="Вставить изображение"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>

                      <div className="w-px bg-gray-300 mx-1" />

                      {/* Font size */}
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
                      className="min-h-[400px] p-4 focus:outline-none"
                      style={{
                        fontFamily: template.styles.fontFamily,
                        fontSize: template.styles.fontSize,
                        color: template.styles.textColor,
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
                  <Label>Имя отправителя</Label>
                  <Input
                    value={template.from_name}
                    onChange={(e) => setTemplate({ ...template, from_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Email отправителя *</Label>
                  <select
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
                  <Label>Email для ответов</Label>
                  <Input
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Цвет фона</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={template.styles.backgroundColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, backgroundColor: e.target.value },
                        })
                      }
                      className="w-20"
                    />
                    <Input
                      value={template.styles.backgroundColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, backgroundColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Цвет текста</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={template.styles.textColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, textColor: e.target.value },
                        })
                      }
                      className="w-20"
                    />
                    <Input
                      value={template.styles.textColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, textColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Цвет кнопок</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={template.styles.buttonColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, buttonColor: e.target.value },
                        })
                      }
                      className="w-20"
                    />
                    <Input
                      value={template.styles.buttonColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, buttonColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Цвет текста кнопок</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={template.styles.buttonTextColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, buttonTextColor: e.target.value },
                        })
                      }
                      className="w-20"
                    />
                    <Input
                      value={template.styles.buttonTextColor}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          styles: { ...template.styles, buttonTextColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Шрифт</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
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
                  <Label>Размер шрифта</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
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
                  </select>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label>Прикрепить файлы (PDF, DOC, DOCX)</Label>
                  <div className="mt-2">
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Нажмите для выбора файлов</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX до 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div>
                    <Label>Прикрепленные файлы:</Label>
                    <div className="mt-2 space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                          >
                            Удалить
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={showButtonDialog} onOpenChange={setShowButtonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вставить кнопку</DialogTitle>
            <DialogDescription>Настройте текст и ссылку для кнопки</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Текст кнопки</Label>
              <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="Нажмите здесь" />
            </div>
            <div>
              <Label>Ссылка (URL)</Label>
              <Input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} placeholder="https://" />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Предпросмотр:</p>
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
                }}
              >
                {buttonText}
              </a>
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
              <Label>Текст ссылки</Label>
              <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Нажмите здесь" />
            </div>
            <div>
              <Label>URL</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" />
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
