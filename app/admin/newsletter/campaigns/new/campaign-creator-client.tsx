"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Send, Users, Mail, Download, FileText, Clock, CheckCircle, AlertCircle, Square, Eye } from "lucide-react"

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
  contactLists: Array<{ id: string; name: string }>
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

  const [campaign, setCampaign] = useState({
    name: "",
    subject: "",
    from_name: "ООО АСТС",
    from_email: smtpAccounts[0]?.email || "",
  })

  useEffect(() => {
    setCampaignStats((prev) => ({
      ...prev,
      total: selectedSubscribers.length,
      progress: selectedSubscribers.length > 0 ? 0 : 0,
    }))
  }, [selectedSubscribers.length])

  const calculateEstimatedTime = (remaining: number): string => {
    const emailsPerMinute = 60 // Предполагаемая скорость отправки
    const minutes = Math.ceil(remaining / emailsPerMinute)

    if (minutes < 1) return "Меньше минуты"
    if (minutes === 1) return "1 минута"
    if (minutes < 60) return `${minutes} минут`

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (remainingMinutes === 0) return `${hours} час${hours > 1 ? "ов" : ""}`
    return `${hours} час${hours > 1 ? "ов" : ""} ${remainingMinutes} минут`
  }

  const updateProgress = (sent: number, failed: number) => {
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
  }

  const monitorCampaignProgress = async (campaignId: string) => {
    const supabase = createBrowserClient()

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

        if (campaignData.status === "sent" || campaignData.status === "failed") {
          clearInterval(interval)
          setIsSending(false)

          if (campaignData.status === "sent") {
            alert(`Рассылка завершена! Успешно отправлено: ${sent} писем`)
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
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedSubscribers(subscribers.map((s) => s.id))
    } else {
      setSelectedSubscribers([])
    }
  }

  const handleSelectSubscriber = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSubscribers([...selectedSubscribers, id])
    } else {
      setSelectedSubscribers(selectedSubscribers.filter((sid) => sid !== id))
      setSelectAll(false)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setCampaign({ ...campaign, subject: template.subject })
    }
  }

  const handleSendCampaign = async () => {
    if (!campaign.name || !selectedTemplate || selectedSubscribers.length === 0) {
      alert("Заполните все поля и выберите получателей")
      return
    }

    if (!confirm(`Запустить рассылку для ${selectedSubscribers.length} получателей?`)) {
      return
    }

    setLoading(true)
    setIsSending(true)
    const supabase = createBrowserClient()

    try {
      const { data: templateData, error: templateError } = await supabase
        .from("email_templates")
        .select("*, attachments")
        .eq("id", selectedTemplate)
        .single()

      if (templateError) throw templateError

      const { data: campaignData, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          ...campaign,
          template_id: selectedTemplate,
          total_recipients: selectedSubscribers.length,
          status: "sending",
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      setCurrentCampaignId(campaignData.id)

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

      monitorCampaignProgress(campaignData.id)
    } catch (error) {
      console.error("Error sending campaign:", error)
      alert("Ошибка при отправке рассылки: " + error.message)
      setIsSending(false)
    } finally {
      setLoading(false)
    }
  }

  const handleStopCampaign = async () => {
    if (!currentCampaignId) return

    if (!confirm("Остановить рассылку?")) {
      return
    }

    const supabase = createBrowserClient()

    try {
      const { error } = await supabase.from("email_campaigns").update({ status: "stopped" }).eq("id", currentCampaignId)

      if (error) throw error

      setIsSending(false)
      alert("Рассылка остановлена")
      router.push("/admin/newsletter")
    } catch (error) {
      console.error("Error stopping campaign:", error)
      alert("Ошибка при остановке рассылки")
    }
  }

  const handleExportSelected = () => {
    const selectedEmails = subscribers.filter((s) => selectedSubscribers.includes(s.id))
    const csv = [["Email", "Имя"].join(","), ...selectedEmails.map((s) => [s.email, s.name || ""].join(","))].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `selected_recipients_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)
  const attachmentsCount = selectedTemplateData?.attachments?.length || 0

  useEffect(() => {
    const loadSubscribers = async () => {
      if (!selectedContactList) {
        setSubscribers([])
        setSelectedSubscribers([])
        return
      }

      const supabase = createBrowserClient()
      try {
        const { data } = await supabase
          .from("contact_list_contacts")
          .select("id, email, name")
          .eq("contact_list_id", selectedContactList)

        console.log("[v0] Loaded contacts from list:", selectedContactList, "Count:", data?.length || 0)

        setSubscribers(data || [])
        setSelectedSubscribers([])
        setSelectAll(false)
      } catch (error) {
        console.error("Error loading subscribers:", error)
        console.log("[v0] Error loading contacts:", error)
      }
    }

    loadSubscribers()
  }, [selectedContactList])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Создать email кампанию</h1>
        <p className="text-gray-600">Настройте и отправьте рассылку подписчикам</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Настройки кампании</h2>
            <div className="space-y-4">
              <div>
                <Label>Название кампании *</Label>
                <Input
                  value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                  placeholder="Например: Акция на экскаваторы"
                />
              </div>

              <div>
                <Label>Выберите базу контактов *</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedContactList}
                  onChange={(e) => setSelectedContactList(e.target.value)}
                >
                  <option value="">Выберите базу контактов</option>
                  {contactLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Выберите шаблон *</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <option value="">Выберите шаблон</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.attachments &&
                        template.attachments.length > 0 &&
                        ` (${template.attachments.length} влож.)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Тема письма *</Label>
                <Input
                  value={campaign.subject}
                  onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                  placeholder="Специальное предложение"
                />
              </div>

              <div>
                <Label>Имя отправителя</Label>
                <Input
                  value={campaign.from_name}
                  onChange={(e) => setCampaign({ ...campaign, from_name: e.target.value })}
                />
              </div>

              <div>
                <Label>Email отправителя *</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={campaign.from_email}
                  onChange={(e) => setCampaign({ ...campaign, from_email: e.target.value })}
                >
                  {smtpAccounts.map((account) => (
                    <option key={account.id} value={account.email}>
                      {account.name} ({account.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Label>Информация о шаблоне:</Label>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Шаблон: {templates.find((t) => t.id === selectedTemplate)?.name}</p>
                    {attachmentsCount > 0 ? (
                      <p className="text-green-600 font-medium">Вложения: {attachmentsCount} файл(ов)</p>
                    ) : (
                      <p className="text-gray-500">Вложения отсутствуют</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Получатели</h2>
              <div className="flex items-center gap-2">
                {selectedSubscribers.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExportSelected}>
                    <Download className="w-4 h-4 mr-2" />
                    Экспорт ({selectedSubscribers.length})
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
                  <Label htmlFor="select-all">Выбрать всех ({subscribers.length})</Label>
                </div>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {subscribers.map((subscriber) => (
                <div key={subscriber.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
                    id={`subscriber-${subscriber.id}`}
                    checked={selectedSubscribers.includes(subscriber.id)}
                    onCheckedChange={(checked) => handleSelectSubscriber(subscriber.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{subscriber.email}</p>
                    {subscriber.name && <p className="text-xs text-gray-500">{subscriber.name}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

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
                <div className="grid grid-cols-3 gap-2 text-xs text-blue-700">
                  <div>
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Отправлено: {campaignStats.sent}
                  </div>
                  <div>
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Ошибок: {campaignStats.failed}
                  </div>
                  <div>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {campaignStats.estimatedTime}
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
                    disabled={loading || selectedSubscribers.length === 0 || !selectedTemplate}
                    className="w-full"
                    size="lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? "Подготовка..." : "Запустить рассылку"}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button onClick={handleStopCampaign} variant="outline" className="w-full bg-transparent" size="lg">
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
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? "Скрыть предпросмотр" : "Предпросмотр письма"}
                  </Button>
                )}
              </div>
            </div>
          </Card>

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
              {selectedSubscribers.length > 0 && (
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
