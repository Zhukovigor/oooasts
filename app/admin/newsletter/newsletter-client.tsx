"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Mail, Users, FileText, Send, Upload, Download, X, Edit, Trash2, Play, Square } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

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
  sent_at?: string
}

interface Props {
  initialSubscribers: Subscriber[]
  initialTemplates: Template[]
  initialCampaigns: Campaign[]
}

type SeparatorType = "auto" | "tab" | "comma" | "semicolon"

export default function NewsletterClient({ initialSubscribers, initialTemplates, initialCampaigns }: Props) {
  const router = useRouter()
  const [subscribers, setSubscribers] = useState(initialSubscribers)
  const [templates, setTemplates] = useState(initialTemplates)
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)
  const [selectedSeparator, setSelectedSeparator] = useState<SeparatorType>("auto")
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null)
  const [editForm, setEditForm] = useState({ email: "", name: "", status: "active" })
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [campaignEditForm, setCampaignEditForm] = useState({ name: "", subject: "" })

  const activeSubscribers = subscribers.filter((s) => s.status === "active").length

  const handleExport = () => {
    if (subscribers.length === 0) {
      alert("Нет данных для экспорта")
      return
    }

    if (!confirm(`Экспортировать ${subscribers.length} подписчиков?`)) {
      return
    }

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

  const detectSeparator = (line: string): string => {
    const separators = {
      'tab': '\t',
      'comma': ',',
      'semicolon': ';'
    }

    const counts = {
      tab: (line.match(/\t/g) || []).length,
      comma: (line.match(/,/g) || []).length,
      semicolon: (line.match(/;/g) || []).length
    }

    const maxSeparator = Object.entries(counts).reduce((max, [key, count]) => 
      count > max.count ? { key, count } : max, 
      { key: 'comma', count: 0 }
    )

    return separators[maxSeparator.key as keyof typeof separators]
  }

  const parseCSVLine = (line: string, separator: string): string[] => {
    const parts: string[] = []
    let currentPart = ''
    let inQuotes = false
    let quoteChar = ''

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if ((char === '"' || char === "'" || char === '«' || char === '»') && !inQuotes) {
        inQuotes = true
        quoteChar = char
        continue
      }

      if (char === quoteChar && inQuotes) {
        if (nextChar === quoteChar) {
          currentPart += char
          i++
        } else {
          inQuotes = false
          quoteChar = ''
        }
        continue
      }

      if (char === separator && !inQuotes) {
        parts.push(currentPart.trim())
        currentPart = ''
        continue
      }

      currentPart += char
    }

    parts.push(currentPart.trim())
    return parts
  }

  const handleImport = async () => {
    if (!importFile) {
      alert("Пожалуйста, выберите файл для импорта")
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const text = await importFile.text()
      const lines = text.split("\n").filter((line) => line.trim())
      
      if (lines.length < 2) {
        setImportResult({ success: 0, errors: ["Файл пустой или содержит только заголовки"] })
        return
      }

      const errors: string[] = []
      let successCount = 0

      const supabase = createBrowserClient()

      let separator = ','
      if (selectedSeparator === "auto") {
        separator = detectSeparator(lines[1])
      } else {
        separator = {
          tab: '\t',
          comma: ',',
          semicolon: ';'
        }[selectedSeparator]
      }

      const headerLine = lines[0].toLowerCase()
      let emailIndex = 0
      let nameIndex = 1
      let statusIndex = -1
      let dateIndex = -1

      const headers = parseCSVLine(headerLine, separator)
      
      headers.forEach((header, index) => {
        const cleanHeader = header.toLowerCase().trim()
        if (cleanHeader.includes('email') || cleanHeader.includes('емейл') || cleanHeader.includes('почта')) {
          emailIndex = index
        } else if (cleanHeader.includes('name') || cleanHeader.includes('имя') || cleanHeader.includes('название')) {
          nameIndex = index
        } else if (cleanHeader.includes('status') || cleanHeader.includes('статус')) {
          statusIndex = index
        } else if (cleanHeader.includes('date') || cleanHeader.includes('дата')) {
          dateIndex = index
        }
      })

      console.log('Detected columns:', { emailIndex, nameIndex, statusIndex, dateIndex })

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          const parts = parseCSVLine(line, separator)
          const rawEmail = parts[emailIndex] || ''
          const rawName = parts[nameIndex] || ''
          const rawStatus = statusIndex >= 0 ? parts[statusIndex] : ''

          let email = rawEmail
            .replace(/[^a-zA-Z0-9@._+-]/g, '')
            .toLowerCase()
            .trim()

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push(`Строка ${i + 1}: Неверный email "${rawEmail}"`)
            continue
          }

          const name = rawName
            .replace(/[^\wа-яА-ЯёЁ0-9\s"«»'.,()\-–—]/g, '')
            .trim()

          let status = "active"
          if (rawStatus) {
            const cleanStatus = rawStatus.toLowerCase().trim()
            if (cleanStatus.includes('active') || cleanStatus.includes('активен') || cleanStatus.includes('активный')) {
              status = "active"
            } else if (cleanStatus.includes('unsubscribed') || cleanStatus.includes('отписан') || cleanStatus.includes('неактивен')) {
              status = "unsubscribed"
            }
          }

          const { data: existing } = await supabase
            .from("newsletter_subscribers")
            .select("id")
            .eq("email", email)
            .single()

          if (existing) {
            const { error: updateError } = await supabase
              .from("newsletter_subscribers")
              .update({ 
                name: name || null,
                status: status
              })
              .eq("id", existing.id)

            if (updateError) {
              errors.push(`Строка ${i + 1}: Ошибка при обновлении "${email}": ${updateError.message}`)
            } else {
              successCount++
            }
          } else {
            const { error } = await supabase.from("newsletter_subscribers").insert({
              email,
              name: name || null,
              status: status,
            })

            if (error) {
              errors.push(`Строка ${i + 1}: Ошибка при добавлении "${email}": ${error.message}`)
            } else {
              successCount++
            }
          }

        } catch (error) {
          errors.push(`Строка ${i + 1}: Ошибка при обработке строки`)
          console.error(`Error processing line ${i + 1}:`, error)
        }
      }

      setImportResult({ success: successCount, errors })

      if (successCount > 0) {
        const { data: newSubscribers, error } = await supabase
          .from("newsletter_subscribers")
          .select("*")
          .order("subscribed_at", { ascending: false })

        if (error) {
          console.error("Error fetching updated subscribers:", error)
        } else if (newSubscribers) {
          setSubscribers(newSubscribers)
        }
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
      console.error("Error deleting template:", error)
      alert("Ошибка при удалении шаблона")
      return
    }

    setTemplates(templates.filter((t) => t.id !== templateId))
    alert("Шаблон успешно удален")
  }

  const handleEditSubscriber = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber)
    setEditForm({
      email: subscriber.email,
      name: subscriber.name || "",
      status: subscriber.status
    })
  }

  const handleUpdateSubscriber = async () => {
    if (!editingSubscriber) return

    if (!editForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      alert("Пожалуйста, введите корректный email")
      return
    }

    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({
        email: editForm.email,
        name: editForm.name || null,
        status: editForm.status
      })
      .eq("id", editingSubscriber.id)

    if (error) {
      console.error("Error updating subscriber:", error)
      alert("Ошибка при обновлении подписчика")
      return
    }

    // Обновляем локальное состояние
    setSubscribers(subscribers.map(s => 
      s.id === editingSubscriber.id 
        ? { ...s, email: editForm.email, name: editForm.name || null, status: editForm.status }
        : s
    ))

    setEditingSubscriber(null)
    setEditForm({ email: "", name: "", status: "active" })
    alert("Подписчик успешно обновлен")
  }

  const handleDeleteSubscriber = async (subscriber: Subscriber) => {
    if (!confirm(`Вы уверены, что хотите удалить подписчика "${subscriber.email}"?`)) {
      return
    }

    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", subscriber.id)

    if (error) {
      console.error("Error deleting subscriber:", error)
      alert("Ошибка при удалении подписчика")
      return
    }

    // Обновляем локальное состояние
    setSubscribers(subscribers.filter(s => s.id !== subscriber.id))
    alert("Подписчик успешно удален")
  }

  // Функции для работы с кампаниями
  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setCampaignEditForm({
      name: campaign.name,
      subject: campaign.subject
    })
  }

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return

    if (!campaignEditForm.name || !campaignEditForm.subject) {
      alert("Пожалуйста, заполните все поля")
      return
    }

    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("email_campaigns")
      .update({
        name: campaignEditForm.name,
        subject: campaignEditForm.subject
      })
      .eq("id", editingCampaign.id)

    if (error) {
      console.error("Error updating campaign:", error)
      alert("Ошибка при обновлении кампании")
      return
    }

    // Обновляем локальное состояние
    setCampaigns(campaigns.map(c => 
      c.id === editingCampaign.id 
        ? { ...c, name: campaignEditForm.name, subject: campaignEditForm.subject }
        : c
    ))

    setEditingCampaign(null)
    setCampaignEditForm({ name: "", subject: "" })
    alert("Кампания успешно обновлена")
  }

  const handleDeleteCampaign = async (campaign: Campaign) => {
    if (!confirm(`Вы уверены, что хотите удалить кампанию "${campaign.name}"?`)) {
      return
    }

    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("email_campaigns")
      .delete()
      .eq("id", campaign.id)

    if (error) {
      console.error("Error deleting campaign:", error)
      alert("Ошибка при удалении кампании")
      return
    }

    // Обновляем локальное состояние
    setCampaigns(campaigns.filter(c => c.id !== campaign.id))
    alert("Кампания успешно удалена")
  }

  const handleStartCampaign = async (campaign: Campaign) => {
    if (!confirm(`Запустить кампанию "${campaign.name}"?`)) {
      return
    }

    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("email_campaigns")
      .update({
        status: "sending",
        sent_at: new Date().toISOString()
      })
      .eq("id", campaign.id)

    if (error) {
      console.error("Error starting campaign:", error)
      alert("Ошибка при запуске кампании")
      return
    }

    // Обновляем локальное состояние
    setCampaigns(campaigns.map(c => 
      c.id === campaign.id 
        ? { ...c, status: "sending", sent_at: new Date().toISOString() }
        : c
    ))

    alert("Кампания запущена")
  }

  const handleStopCampaign = async (campaign: Campaign) => {
    if (!confirm(`Остановить кампанию "${campaign.name}"?`)) {
      return
    }

    const supabase = createBrowserClient()
    const { error } = await supabase
      .from("email_campaigns")
      .update({
        status: "stopped"
      })
      .eq("id", campaign.id)

    if (error) {
      console.error("Error stopping campaign:", error)
      alert("Ошибка при остановке кампании")
      return
    }

    // Обновляем локальное состояние
    setCampaigns(campaigns.map(c => 
      c.id === campaign.id 
        ? { ...c, status: "stopped" }
        : c
    ))

    alert("Кампания остановлена")
  }

  const resetImportModal = () => {
    setShowImportModal(false)
    setImportFile(null)
    setImportResult(null)
    setSelectedSeparator("auto")
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

          {subscribers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет подписчиков</h3>
              <p className="text-gray-600 mb-4">Добавьте подписчиков вручную или импортируйте из CSV</p>
              <Button onClick={() => setShowImportModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Импорт подписчиков
              </Button>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">№</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Имя</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата подписки</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subscribers.map((subscriber, index) => (
                      <tr key={subscriber.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500 text-center">{index + 1}</td>
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
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSubscriber(subscriber)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubscriber(subscriber)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
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

          {templates.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет шаблонов</h3>
              <p className="text-gray-600 mb-4">Создайте ваш первый шаблон email рассылки</p>
              <Link href="/admin/newsletter/templates/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать шаблон
                </Button>
              </Link>
            </Card>
          ) : (
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
          )}
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

          {campaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет кампаний</h3>
              <p className="text-gray-600 mb-4">Создайте вашу первую email кампанию</p>
              <Link href="/admin/newsletter/campaigns/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать кампанию
                </Button>
              </Link>
            </Card>
          ) : (
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Действия</th>
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
                                  : campaign.status === "stopped"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {campaign.status === "sent"
                              ? "Отправлено"
                              : campaign.status === "sending"
                                ? "Отправка"
                                : campaign.status === "stopped"
                                  ? "Остановлено"
                                  : "Черновик"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {campaign.sent_count} / {campaign.total_recipients}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {campaign.sent_at 
                            ? new Date(campaign.sent_at).toLocaleDateString("ru-RU")
                            : new Date(campaign.created_at).toLocaleDateString("ru-RU")
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {campaign.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStartCampaign(campaign)}
                                className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                title="Запустить кампанию"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            {campaign.status === "sending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStopCampaign(campaign)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                title="Остановить кампанию"
                              >
                                <Square className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCampaign(campaign)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              title="Редактировать кампанию"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCampaign(campaign)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              title="Удалить кампанию"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Модальное окно редактирования подписчика */}
      {editingSubscriber && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Редактировать подписчика</h2>
                <Button variant="ghost" size="icon" onClick={() => setEditingSubscriber(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя (опционально)
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Имя компании или ФИО"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Статус
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Активен</option>
                    <option value="unsubscribed">Отписан</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setEditingSubscriber(null)}>
                    Отмена
                  </Button>
                  <Button onClick={handleUpdateSubscriber}>
                    Сохранить
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Модальное окно редактирования кампании */}
      {editingCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Редактировать кампанию</h2>
                <Button variant="ghost" size="icon" onClick={() => setEditingCampaign(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название кампании *
                  </label>
                  <input
                    type="text"
                    value={campaignEditForm.name}
                    onChange={(e) => setCampaignEditForm({ ...campaignEditForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Название кампании"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тема письма *
                  </label>
                  <input
                    type="text"
                    value={campaignEditForm.subject}
                    onChange={(e) => setCampaignEditForm({ ...campaignEditForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Тема письма"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setEditingCampaign(null)}>
                    Отмена
                  </Button>
                  <Button onClick={handleUpdateCampaign}>
                    Сохранить
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Импорт подписчиков</h2>
                <Button variant="ghost" size="icon" onClick={resetImportModal}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Разделитель в CSV файле:
                  </label>
                  <select 
                    value={selectedSeparator}
                    onChange={(e) => setSelectedSeparator(e.target.value as SeparatorType)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="auto">Автоопределение (рекомендуется)</option>
                    <option value="tab">Табуляция (Excel)</option>
                    <option value="comma">Запятая</option>
                    <option value="semicolon">Точка с запятой</option>
                  </select>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Загрузите CSV файл. Поддерживаются файлы с колонками на русском или английском.
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Автоматически определяются колонки: Email, Имя/Name, Статус/Status<br />
                    Форматы файлов (поддерживаются оба):<br />
                    <code className="bg-gray-100 p-1 rounded text-xs block mt-1">
                      // Английские заголовки<br />
                      Email,Name,Status,Date<br />
                      test@example.com,Company Name,active,2024-01-01<br />
                      <br />
                      // Русские заголовки<br />
                      Email,Имя,Статус,Дата<br />
                      test@example.com,Название компании,Активен,2024-01-01
                    </code>
                  </p>

                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {importFile && (
                    <p className="text-sm text-green-600 mt-2">Выбран файл: {importFile.name}</p>
                  )}
                </div>

                {importResult && (
                  <div className="space-y-2">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-800 font-semibold">Успешно импортировано: {importResult.success}</p>
                    </div>

                    {importResult.errors.length > 0 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800 font-semibold mb-2">Ошибки ({importResult.errors.length}):</p>
                        <div className="max-h-48 overflow-y-auto">
                          <ul className="text-sm text-red-700 space-y-1">
                            {importResult.errors.map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={resetImportModal} disabled={importing}>
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={!importFile || importing}
                    className="min-w-24"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Импорт...
                      </>
                    ) : (
                      "Импортировать"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
