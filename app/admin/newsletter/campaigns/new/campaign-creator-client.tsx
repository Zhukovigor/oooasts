"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { createBrowserClient } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Send, Users, Mail } from "lucide-react"

interface Template {
  id: string
  name: string
  subject: string
  html_content: string
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

interface Props {
  templates: Template[]
  subscribers: Subscriber[]
  smtpAccounts: SmtpAccount[]
}

export default function CampaignCreatorClient({ templates, subscribers, smtpAccounts }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const [campaign, setCampaign] = useState({
    name: "",
    subject: "",
    from_name: "ООО АСТС",
    from_email: smtpAccounts[0]?.email || "",
  })

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

    if (!confirm(`Отправить рассылку ${selectedSubscribers.length} получателям?`)) {
      return
    }

    setLoading(true)
    const supabase = createBrowserClient()

    try {
      // Create campaign
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

      // Send emails via API
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignData.id,
          templateId: selectedTemplate,
          subscriberIds: selectedSubscribers,
          fromEmail: campaign.from_email,
        }),
      })

      if (!response.ok) throw new Error("Failed to send emails")

      alert("Рассылка запущена!")
      router.push("/admin/newsletter")
    } catch (error) {
      console.error("Error sending campaign:", error)
      alert("Ошибка при отправке рассылки")
    } finally {
      setLoading(false)
    }
  }

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
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Получатели</h2>
              <div className="flex items-center gap-2">
                <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                <Label>Выбрать всех ({subscribers.length})</Label>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {subscribers.map((subscriber) => (
                <div key={subscriber.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Checkbox
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
            <h2 className="text-xl font-semibold mb-4">Сводка</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Получателей</p>
                  <p className="text-2xl font-bold">{selectedSubscribers.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Шаблон</p>
                  <p className="font-medium">
                    {selectedTemplate ? templates.find((t) => t.id === selectedTemplate)?.name : "Не выбран"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleSendCampaign} disabled={loading} className="w-full" size="lg">
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Отправка..." : "Отправить рассылку"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
