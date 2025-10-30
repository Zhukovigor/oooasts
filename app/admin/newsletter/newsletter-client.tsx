"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Mail, Users, FileText, Send } from "lucide-react"
import Link from "next/link"

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
  const [subscribers] = useState(initialSubscribers)
  const [templates] = useState(initialTemplates)
  const [campaigns] = useState(initialCampaigns)

  const activeSubscribers = subscribers.filter((s) => s.status === "active").length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email рассылка</h1>
        <p className="text-gray-600">Управление подписчиками и email кампаниями</p>
      </div>

      {/* Stats */}
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
              <Link href="/admin/newsletter/import">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Импорт
                </Button>
              </Link>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
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
    </div>
  )
}
