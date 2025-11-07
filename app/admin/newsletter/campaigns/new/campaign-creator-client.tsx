"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Send, Users, Mail, Download, FileText, Clock, CheckCircle, AlertCircle, Square, Eye, Loader2 } from "lucide-react"

interface Template {
  id: string
  name: string
  subject: string
  html_content: string
  attachments?: Array<{
    name: string
    url: string
    size: number
    type: string
  }>
}

interface Subscriber {
  id: string
  email: string
  name: string | null
}

interface SmtpAccount {
  id: string
  name: string
  email: string
}

interface CampaignStats {
  total: number
  sent: number
  failed: number
  progress: number
  estimatedTime: string
}

interface Props {
  templates: Template[]
  contactLists: Array<{ id: string; name: string; contacts_count?: number }>
  smtpAccounts: SmtpAccount[]
}

export default function CampaignCreatorClient({ templates, contactLists, smtpAccounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedContactList, setSelectedContactList] = useState<string>("")
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({
    total: 0,
    sent: 0,
    failed: 0,
    progress: 0,
    estimatedTime: "0 мин",
  })
  const [isSending, setIsSending] = useState(false)
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [loadingSubscribers, setLoadingSubscribers] = useState(false)

  const [campaign, setCampaign] = useState({
    name: "",
    subject: "",
    from_name: "ООО АСТС",
    from_email: smtpAccounts[0]?.email || "",
  })

  const supabase = createBrowserClient()

  // Расчет оставшегося времени
  const calculateEstimatedTime = useCallback((remaining: number): string => {
    const emailsPerMinute = 60 // Предполагаемая скорость отправки
    const minutes = Math.ceil(remaining / emailsPerMinute)

    if (minutes < 1) return "Меньше минуты"
    if (minutes === 1) return "1 минута"
    if (minutes < 60) return `${minutes} минут`

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes === 0) return `${hours} час${hours > 1 ? "ов" : ""}`
    return `${hours} час${hours > 1 ? "ов" : ""} ${remainingMinutes} минут`
  }, [])

  // Обновление прогресса отправки
  const updateProgress = useCallback((sent: number, failed: number) => {
    const total = selectedSubscribers.length
    const processed = sent + failed
    const progress = total > 0 ? (processed / total) * 100 : 0
    const remaining = total - processed

    setCampaignStats({
      total,
      sent,
      failed,
      progress,
      estimatedTime: calculateEstimatedTime(remaining),
    })
  }, [selectedSubscribers.length, calculateEstimatedTime])

  // Мониторинг прогресса кампании
  const monitorCampaignProgress = useCallback(async (campaignId: string) => {
    const interval = setInterval(async () => {
      try {
        const { data: campaignData, error } = await supabase
          .from("email_campaigns")
          .select("sent_count, status")
          .eq("id", campaignId)
          .single()

        if (error) throw error

        const { data: logsData } = await supabase
          .from("email_campaign_logs")
          .select("status")
          .eq("campaign_id", campaignId)

        const sent = logsData?.filter((log) => log.status === "sent").length || 0
        const failed = logsData?.filter((log) => log.status === "failed").length || 0

        updateProgress(sent, failed)

        if (campaignData.status === "sent" || campaignData.status === "failed" || campaignData.status === "stopped") {
          clearInterval(interval)
          setIsSending(false)

          if (campaignData.status === "sent") {
            alert(`Рассылка завершена! Успешно отправлено: ${sent} писем`)
          } else if (campaignData.status === "stopped") {
            alert(`Рассылка остановлена. Отправлено: ${sent}, Ошибок: ${failed}`)
          } else {
            alert(`Рассылка завершена с ошибками. Отправлено: ${sent}, Ошибок: ${failed}`)
          }

          router.push("/admin/newsletter")
        }
      } catch (error) {
        console.error("Error monitoring campaign:", error)
        clearInterval(interval)
        setIsSending(false)
      }
    }, 2000)

    return interval
  }, [supabase, updateProgress, router])

  // Выбор всех подписчиков
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedSubscribers(subscribers.map((s) => s.id))
    } else {
      setSelectedSubscribers([])
    }
  }

  // Выбор отдельного подписчика
  const handleSelectSubscriber = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSubscribers([...selectedSubscribers, id])
    } else {
      setSelectedSubscribers(selectedSubscribers.filter((sid) => sid !== id))
      setSelectAll(false)
    }
  }

  // Изменение шаблона
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setCampaign(prev => ({ ...prev, subject: template.subject }))
    }
  }

  // Загрузка подписчиков при выборе базы контактов
  useEffect(() => {
    const loadSubscribers = async () => {
      if (!selectedContactList) {
        setSubscribers([])
        setSelectedSubscribers([])
        return
      }

      setLoadingSubscribers(true)
      try {
        const { data, error } = await supabase
          .from("contact_list_contacts")
          .select("id, email, name")
          .eq("list_id", selectedContactList)

        if (error) throw error

        console.log("Loaded contacts from list:", selectedContactList, "Count:", data?.length || 0)
        setSubscribers(data || [])
        setSelectedSubscribers([])
        setSelectAll(false)
      } catch (error) {
        console.error("Error loading subscribers:", error)
        alert("Ошибка при загрузке контактов")
      } finally {
        setLoadingSubscribers(false)
      }
    }

    loadSubscribers()
  }, [selectedContactList, supabase])

  // Обновление статистики при изменении выбранных подписчиков
  useEffect(() => {
    setCampaignStats(prev => ({
      ...prev,
      total: selectedSubscribers.length,
      progress: 0,
    }))
  }, [selectedSubscribers.length])

  // Отправка кампании
  const handleSendCampaign = async () => {
    if (!campaign.name || !selectedTemplate || selectedSubscribers.length === 0) {
      alert("Заполните все поля и выберите получателей")
      return
    }

    if (!campaign.subject.trim()) {
      alert("Введите тему письма")
      return
    }

    if (!confirm(`Запустить рассылку для ${selectedSubscribers.length} получателей?`)) {
      return
    }

    setLoading(true)
    setIsSending(true)
    
    try {
      // Получаем данные шаблона
      const { data: templateData, error: templateError } = await supabase
        .from("email_templates")
        .select("*, attachments")
        .eq("id", selectedTemplate)
        .single()

      if (templateError) throw templateError

      // Создаем кампанию
      const { data: campaignData, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          name: campaign.name,
          subject: campaign.subject,
          from_name: campaign.from_name,
          from_email: campaign.from_email,
          template_id: selectedTemplate,
          total_recipients: selectedSubscribers.length,
          status: "sending",
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      setCurrentCampaignId(campaignData.id)

      // Запускаем отправку через API
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignData.id,
          templateId: selectedTemplate,
          templateData: {
            subject: templateData.subject,
            html_content: templateData.html_content,
            from_name: templateData.from_name,
            reply_to: templateData.reply_to,
            attachments: templateData.attachments || [],
          },
          subscriberIds: selectedSubscribers,
          fromEmail: campaign.from_email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send emails")
      }

      // Начинаем мониторинг прогресса
      monitorCampaignProgress(campaignData.id)
    } catch (error: any) {
      console.error("Error sending campaign:", error)
      alert("Ошибка при отправке рассылки: " + (error.message || "Неизвестная ошибка"))
      setIsSending(false)
      
      // Обновляем статус кампании на failed в случае ошибки
      if (currentCampaignId) {
        await supabase
          .from("email_campaigns")
          .update({ status: "failed" })
          .eq("id", currentCampaignId)
      }
    } finally {
      setLoading(false)
    }
  }

  // Остановка кампании
  const handleStopCampaign = async () => {
    if (!currentCampaignId) return

    if (!confirm("Остановить рассылку?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("email_campaigns")
        .update({ status: "stopped" })
        .eq("id", currentCampaignId)

      if (error) throw error

      setIsSending(false)
      alert("Рассылка остановлена")
      router.push("/admin/newsletter")
    } catch (error) {
      console.error("Error stopping campaign:", error)
      alert("Ошибка при остановке рассылки")
    }
  }

  // Экспорт выбранных подписчиков
  const handleExportSelected = () => {
    if (selectedSubscribers.length === 0) {
      alert("Выберите подписчиков для экспорта")
      return
    }

    const selectedEmails = subscribers.filter((s) => selectedSubscribers.includes(s.id))
    const csv = [
      ["Email", "Имя"].join(","),
      ...selectedEmails.map((s) => [s.email, s.name || ""].join(","))
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `selected_recipients_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)
  const attachmentsCount = selectedTemplateData?.attachments?.length || 0
  const selectedContactListData = contactLists.find((list) => list.id === selectedContactList)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Создать email кампанию</h1>
        <p className="text-gray-600">Настройте и отправьте рассылку подписчикам</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основные настройки */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Настройки кампании</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Название кампании *</Label>
                <Input
                  id="campaign-name"
                  value={campaign.name}
                  onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Например: Акция на экскаваторы"
                  disabled={isSending}
                />
              </div>

              <div>
                <Label htmlFor="contact-list">Выберите базу контактов *</Label>
                <select
                  id="contact-list"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedContactList}
                  onChange={(e) => setSelectedContactList(e.target.value)}
                  disabled={isSending}
                >
                  <option value="">Выберите базу контактов</option>
                  {contactLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.contacts_count || 0} контактов)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="template">Выберите шаблон *</Label>
                <select
                  id="template"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  disabled={isSending}
                >
                  <option value="">Выберите шаблон</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.attachments && template.attachments.length > 0 && ` (${template.attachments.length} влож.)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="subject">Тема письма *</Label>
                <Input
                  id="subject"
                  value={campaign.subject}
                  onChange={(e) => setCampaign(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Специальное предложение"
                  disabled={isSending}
                />
              </div>

              <div>
                <Label htmlFor="from-name">Имя отправителя</Label>
                <Input
                  id="from-name"
                  value={campaign.from_name}
                  onChange={(e) => setCampaign(prev => ({ ...prev, from_name: e.target.value }))}
                  disabled={isSending}
                />
              </div>

              <div>
                <Label htmlFor="from-email">Email отправителя *</Label>
                <select
                  id="from-email"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={campaign.from_email}
                  onChange={(e) => setCampaign(prev => ({ ...prev, from_email: e.target.value }))}
                  disabled={isSending}
                >
                  {smtpAccounts.map((account) => (
                    <option key={account.id} value={account.email}>
                      {account.name} ({account.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Label>Информация о шаблоне:</Label>
                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p><strong>Название:</strong> {templates.find((t) => t.id === selectedTemplate)?.name}</p>
                    {attachmentsCount > 0 ? (
                      <p className="text-green-600 font-medium">
                        <strong>Вложения:</strong> {attachmentsCount} файл(ов)
                      </p>
                    ) : (
                      <p className="text-gray-500"><strong>Вложения:</strong> отсутствуют</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Список получателей */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Получатели</h2>
              <div className="flex items-center gap-2">
                {selectedSubscribers.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportSelected}
                    disabled={isSending}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Экспорт ({selectedSubscribers.length})
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    disabled={isSending || subscribers.length === 0}
                  />
                  <Label htmlFor="select-all" className="text-sm">
                    Выбрать всех ({subscribers.length})
                  </Label>
                </div>
              </div>
            </div>

            {loadingSubscribers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <span>Загрузка контактов...</span>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {selectedContactList ? "В выбранной базе нет контактов" : "Выберите базу контактов"}
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <Checkbox
                      id={`subscriber-${subscriber.id}`}
                      checked={selectedSubscribers.includes(subscriber.id)}
                      onCheckedChange={(checked) => handleSelectSubscriber(subscriber.id, checked as boolean)}
                      disabled={isSending}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{subscriber.email}</p>
                      {subscriber.name && (
                        <p className="text-xs text-gray-500 truncate">{subscriber.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Панель сводки и управления */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Сводка кампании</h2>

            {isSending && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Отправка писем</span>
                  <span className="text-sm text-blue-600">{Math.round(campaignStats.progress)}%</span>
                </div>
                <Progress value={campaignStats.progress} className="mb-3" />
                <div className="grid grid-cols-2 gap-3 text-xs text-blue-700">
                  <div className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Отправлено: {campaignStats.sent}
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Ошибок: {campaignStats.failed}
                  </div>
                  <div className="flex items-center col-span-2">
                    <Clock className="w-3 h-3 mr-1" />
                    Осталось: {campaignStats.estimatedTime}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Получателей</p>
                    <p className="text-xl font-bold">{selectedSubscribers.length}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Шаблон</p>
                    <p className="text-sm font-medium truncate">
                      {selectedTemplate ? templates.find((t) => t.id === selectedTemplate)?.name : "Не выбран"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {attachmentsCount > 0 && (
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-gray-600">Вложения</span>
                    </div>
                    <span className="text-sm font-medium text-orange-600">{attachmentsCount} файл(ов)</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Отправитель</span>
                  </div>
                  <span className="text-sm font-medium text-purple-600 truncate max-w-[120px]">
                    {campaign.from_email}
                  </span>
                </div>

                {selectedSubscribers.length > 0 && (
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Примерное время</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {calculateEstimatedTime(selectedSubscribers.length)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                {!isSending ? (
                  <Button
                    onClick={handleSendCampaign}
                    disabled={loading || selectedSubscribers.length === 0 || !selectedTemplate || !campaign.name.trim() || !campaign.subject.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {loading ? "Подготовка..." : "Запустить рассылку"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      onClick={handleStopCampaign} 
                      variant="outline" 
                      className="w-full bg-transparent border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" 
                      size="lg"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Остановить рассылку
                    </Button>
                    <div className="text-xs text-gray-500 text-center">
                      Отправлено {campaignStats.sent} из {campaignStats.total} писем
                    </div>
                  </div>
                )}

                {selectedTemplate && (
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={isSending}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? "Скрыть предпросмотр" : "Предпросмотр письма"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Быстрая статистика */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Быстрая статистика</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Активных подписчиков:</span>
                <span className="font-medium">{subscribers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Выбрано:</span>
                <span className="font-medium">{selectedSubscribers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Доступных шаблонов:</span>
                <span className="font-medium">{templates.length}</span>
              </div>
              {selectedSubscribers.length > 0 && subscribers.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Охват аудитории:</span>
                  <span className="font-medium text-green-600">
                    {((selectedSubscribers.length / subscribers.length) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Предпросмотр письма */}
      {showPreview && selectedTemplateData && (
        <div className="mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Предпросмотр письма</h2>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Закрыть
              </Button>
            </div>
            <div className="border rounded-lg p-4 bg-white">
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-gray-600">
                  От: {campaign.from_name} &lt;{campaign.from_email}&gt;
                </p>
                <p className="text-sm text-gray-600">Тема: {campaign.subject}</p>
                {attachmentsCount > 0 && (
                  <p className="text-sm text-green-600">Вложения: {attachmentsCount} файл(ов)</p>
                )}
              </div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedTemplateData.html_content }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
