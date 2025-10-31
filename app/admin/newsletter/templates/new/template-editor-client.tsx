"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ImageIcon, Upload, Save, Eye } from "lucide-react"

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
    const buttonHtml = `
      <a href="https://example.com" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: ${template.styles.buttonColor};
        color: ${template.styles.buttonTextColor};
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        margin: 10px 0;
      ">Нажмите здесь</a>
    `
    document.execCommand("insertHTML", false, buttonHtml)
    updateContent()
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
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const handleSave = async () => {
    if (!template.name || !template.subject || !template.html_content) {
      alert("Заполните все обязательные поля")
      return
    }

    setLoading(true)
    const supabase = createBrowserClient()

    try {
      // Upload attachments if any
      const attachmentUrls = []
      for (const file of attachments) {
        const fileName = `${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("email-attachments")
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("email-attachments").getPublicUrl(fileName)

        attachmentUrls.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type,
        })
      }

      const { error } = await supabase.from("email_templates").insert({
        ...template,
        attachments: attachmentUrls,
      })

      if (error) throw error

      alert("Шаблон успешно сохранен!")
      router.push("/admin/newsletter")
    } catch (error) {
      console.error("Error saving template:", error)
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
                    {/* Toolbar */}
                    <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("bold")}>
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("italic")}>
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("underline")}>
                        <Underline className="w-4 h-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("justifyLeft")}>
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("justifyCenter")}>
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyFormat("justifyRight")}>
                        <AlignRight className="w-4 h-4" />
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" />
                      <Button type="button" variant="ghost" size="sm" onClick={insertButton}>
                        Кнопка
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={insertImage}>
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <select
                        className="px-2 py-1 border rounded text-sm"
                        onChange={(e) => applyFormat("fontSize", e.target.value)}
                      >
                        <option value="3">Маленький</option>
                        <option value="4" selected>
                          Обычный
                        </option>
                        <option value="5">Большой</option>
                        <option value="6">Очень большой</option>
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
                      dangerouslySetInnerHTML={{ __html: template.html_content }}
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
    </div>
  )
}
