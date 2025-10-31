"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Mail, Users, FileText, Send, Upload, Download } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase-client"

interface Subscriber {
  id: string
  email: string
  name: string | null
  status: string
  subscribed_at: string
}

interface Template {
  id: string
  name: string
  subject: string
  from_email: string
  is_active: boolean
  created_at: string
}

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  total_recipients: number
  sent_count: number
  created_at: string
}

interface Props {
  initialSubscribers: Subscriber[]
  initialTemplates: Template[]
  initialCampaigns: Campaign[]
}

export default function NewsletterClient({ initialSubscribers, initialTemplates, initialCampaigns }: Props) {
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [templates, setTemplates] = useState(initialTemplates)
  const [campaigns] = useState(initialCampaigns)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)

  const activeSubscribers = subscribers.filter((s) => s.status === "active").length

  const handleExport = () => {
    const csv = [
      ["Email", "Имя", "Статус", "Дата подписки"].join(","),
      ...subscribers.map((s) =>
        [s.email, s.name || "", s.status, new Date(s.subscribed_at).toLocaleDateString("ru-RU")].join(","),
      ),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `subscribers_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const handleImport = async () => {
    if (!importFile) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await importFile.text()
      const lines = text.split("\n").filter((line) => line.trim())
      const errors: string[] = []
      let successCount = 0

      const supabase = createBrowserClient()

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const [email, name] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""))

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(`Строка ${i + 1}: Неверный email "${email}"`)
          continue
        }

        const { data: existing } = await supabase
          .from("newsletter_subscribers")
          .select("id")
          .eq("email", email)
          .single()

        if (existing) {
          errors.push(`Строка ${i + 1}: Email "${email}" уже существует`)
          continue
        }

        const { error } = await supabase.from("newsletter_subscribers").insert({
          email,
          name: name || null,
          status: "active",
        })

        if (error) {
          errors.push(`Строка ${i + 1}: Ошибка при добавлении "${email}": ${error.message}`)
        } else {
          successCount++
        }
      }

      setImportResult({ success: successCount, errors })

      const { data: newSubscribers } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false })

      if (newSubscribers) {
        setSubscribers(newSubscribers)
      }
    } catch (error) {
      console.error("Import error:", error)
      setImportResult({ success: 0, errors: ["Ошибка при чтении файла"] })
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить шаблон "${templateName}"?`)) {
      return
    }

    const supabase = createBrowserClient()
    const { error } = await supabase.from("email_templates").delete().eq("id", templateId)

    if (error) {
      console.error("[v0] Error deleting template:", error)
      alert("Ошибка при удалении шаблона")
      return
    }

    setTemplates(templates.filter((t) => t.id !== templateId))
    alert("Шаблон успешно удален")
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email рассылка</h1>
        <p className="text-gray-600">Управление подписчиками и email кампаниями</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего подписчиков</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{subscribers.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Активных</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{activeSubscribers}</p>
            </div>
            <Mail className="w-12 h-12 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Шаблонов</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{templates.length}</p>
            </div>
            <FileText className="w-12 h-12 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Кампаний</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{campaigns.length}</p>
            </div>
            <Send className="w-12 h-12 text-orange-500" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="subscribers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscribers">Подписчики</TabsTrigger>
          <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          <TabsTrigger value="campaigns">Кампании</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">База подписчиков</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Импорт
              </Button>
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Экспорт
              </Button>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата подписки</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{subscriber.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subscriber.name || "—"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subscriber.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {subscriber.status === "active" ? "Активен" : "Отписан"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(subscriber.subscribed_at).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Шаблоны писем</h2>
            <Link href="/admin/newsletter/templates/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Создать шаблон
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <FileText className="w-8 h-8 text-purple-500" />
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      template.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {template.is_active ? "Активен" : "Неактивен"}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.subject}</p>
                <div className="flex gap-2">
                  <Link href={`/admin/newsletter/templates/edit/${template.id}`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      Редактировать
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50 bg-transparent"
                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                  >
                    Удалить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Email кампании</h2>
            <Link href="/admin/newsletter/campaigns/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Создать кампанию
              </Button>
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тема</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Отправлено</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{campaign.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{campaign.subject}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            campaign.status === "sent"
                              ? "bg-green-100 text-green-800"
                              : campaign.status === "sending"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {campaign.status === "sent"
                            ? "Отправлено"
                            : campaign.status === "sending"
                              ? "Отправка"
                              : "Черновик"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {campaign.sent_count} / {campaign.total_recipients}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(campaign.created_at).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 m-4">
            <h2 className="text-2xl font-bold mb-4">Импорт подписчиков</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Загрузите CSV файл с колонками: Email, Имя (опционально)</p>
                <p className="text-xs text-gray-500 mb-4">Пример: email@example.com,Иван Иванов</p>

                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {importResult && (
                <div className="space-y-2">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 font-semibold">Успешно импортировано: {importResult.success}</p>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md max-h-48 overflow-y-auto">
                      <p className="text-red-800 font-semibold mb-2">Ошибки ({importResult.errors.length}):</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResult.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowImportModal(false)} disabled={importing}>
                  Отмена
                </Button>
                <Button onClick={handleImport} disabled={!importFile || importing}>
                  {importing ? "Импорт..." : "Импортировать"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
