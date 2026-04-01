"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, MapPin, Phone, Mail, Send, Calendar, Eye } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase-client"
import SiteNavigation from "@/components/site-navigation"
import Footer from "@/components/footer"

type Announcement = {
  id: string
  type: "demand" | "supply"
  title: string
  description: string
  category: string | null
  price: number | null
  currency: string
  contact_name: string
  contact_phone: string
  contact_email: string
  contact_telegram: string | null
  contact_whatsapp: string | null
  location: string | null
  views_count: number
  created_at: string
}

const categories = [
  "Экскаваторы",
  "Бульдозеры",
  "Погрузчики",
  "Автокраны",
  "Автобетононасосы",
  "Грейдеры",
  "Катки",
  "Тралы",
  "Самосвалы",
  "Другое",
]

const currencies = [
  { value: "RUB", label: "₽ Рубли", symbol: "₽" },
  { value: "USD", label: "$ Доллары", symbol: "$" },
  { value: "EUR", label: "€ Евро", symbol: "€" },
  { value: "CNY", label: "¥ Юани", symbol: "¥" },
]

export default function AnnouncementsClient({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createBrowserClient()

  const filteredAnnouncements = (type: "demand" | "supply") => {
    return announcements.filter((ann) => {
      const matchesType = ann.type === type
      const matchesSearch =
        searchQuery === "" ||
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || ann.category === selectedCategory

      return matchesType && matchesSearch && matchesCategory
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    const whatsappRaw = formData.get("contact_whatsapp") as string
    const whatsappFormatted = whatsappRaw ? whatsappRaw.replace(/\D/g, "") : null

    const data = {
      type: formData.get("type") as "demand" | "supply",
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      price: formData.get("price") ? Number(formData.get("price")) : null,
      currency: (formData.get("currency") as string) || "RUB",
      contact_name: formData.get("contact_name") as string,
      contact_phone: formData.get("contact_phone") as string,
      contact_email: formData.get("contact_email") as string,
      contact_telegram: formData.get("contact_telegram") as string,
      contact_whatsapp: whatsappFormatted,
      location: formData.get("location") as string,
      is_active: false,
      is_moderated: false, // Важно: новое объявление не модерировано
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 дней
    }

    const { error } = await supabase.from("announcements").insert([data])

    setIsSubmitting(false)

    if (error) {
      setMessage({ type: "error", text: "Ошибка при создании объявления. Попробуйте еще раз." })
      console.error("Error creating announcement:", error)
    } else {
      setMessage({
        type: "success",
        text: "Объявление отправлено на модерацию. После проверки оно появится на сайте.",
      })
      ;(e.target as HTMLFormElement).reset()
      setIsDialogOpen(false)

      // НЕ обновляем список объявлений на клиенте, т.к. новое объявление еще не одобрено
      // Оно появится только после модерации в админке
    }
  }

  const incrementViews = async (id: string) => {
    await supabase.rpc("increment_announcement_views", { announcement_id: id })
  }

  const incrementContactClicks = async (id: string) => {
    await supabase.rpc("increment_announcement_contact_clicks", { announcement_id: id })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNavigation />

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Бесплатные объявления</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Бесплатная доска объявлений по спецтехнике. Разместите объявление о покупке или продаже строительной
            техники, оборудования и запчастей.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Поиск по объявлениям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus size={20} className="mr-2" />
                Разместить объявление
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Разместить объявление</DialogTitle>
                <DialogDescription>
                  Заполните форму ниже. Объявление будет опубликовано после модерации.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Тип объявления *</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demand">Спрос (куплю)</SelectItem>
                      <SelectItem value="supply">Предложение (продам)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Заголовок *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Например: Куплю экскаватор Komatsu PC200"
                    required
                    maxLength={255}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Описание *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Подробное описание вашего объявления..."
                    required
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Категория</Label>
                    <Select name="category">
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Местоположение</Label>
                    <Input id="location" name="location" placeholder="Город, регион" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Цена</Label>
                    <Input id="price" name="price" type="number" placeholder="Необязательно" />
                  </div>
                  <div>
                    <Label htmlFor="currency">Валюта</Label>
                    <Select name="currency" defaultValue="RUB">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-4">Контактная информация</h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="contact_name">Имя *</Label>
                      <Input id="contact_name" name="contact_name" required placeholder="Ваше имя" />
                    </div>

                    <div>
                      <Label htmlFor="contact_phone">Телефон *</Label>
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        type="tel"
                        required
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_email">Email *</Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        required
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_whatsapp">WhatsApp (необязательно)</Label>
                      <Input
                        id="contact_whatsapp"
                        name="contact_whatsapp"
                        type="tel"
                        placeholder="79991234567"
                      />
                      <p className="text-xs text-gray-500 mt-1">Введите номер без знака +</p>
                    </div>

                    <div>
                      <Label htmlFor="contact_telegram">Telegram (необязательно)</Label>
                      <Input id="contact_telegram" name="contact_telegram" placeholder="@username" />
                    </div>
                  </div>
                </div>

                {message && (
                  <div
                    className={`p-4 rounded-lg ${
                      message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Отправка..." : "Разместить объявление"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs for Demand and Supply */}
        <Tabs defaultValue="demand" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="demand" className="text-lg">
              Спрос ({filteredAnnouncements("demand").length})
            </TabsTrigger>
            <TabsTrigger value="supply" className="text-lg">
              Предложение ({filteredAnnouncements("supply").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demand">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements("demand").map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onView={incrementViews}
                  incrementContactClicks={incrementContactClicks}
                />
              ))}
            </div>
            {filteredAnnouncements("demand").length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Объявлений не найдено</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="supply">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAnnouncements("supply").map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onView={incrementViews}
                  incrementContactClicks={incrementContactClicks}
                />
              ))}
            </div>
            {filteredAnnouncements("supply").length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Объявлений не найдено</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}

function AnnouncementCard({
  announcement,
  onView,
  incrementContactClicks,
}: {
  announcement: Announcement
  onView: (id: string) => void
  incrementContactClicks: (id: string) => void
}) {
  const [showContacts, setShowContacts] = useState(false)

  const handleShowContacts = () => {
    setShowContacts(true)
    onView(announcement.id)
    incrementContactClicks(announcement.id)
  }

  const getCurrencySymbol = (currency: string) => {
    const curr = currencies.find((c) => c.value === currency)
    return curr?.symbol || currency
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-900 flex-1">{announcement.title}</h3>
        {announcement.price && (
          <div className="text-lg font-bold text-blue-600 ml-2">
            {announcement.price.toLocaleString("ru-RU")} {getCurrencySymbol(announcement.currency)}
          </div>
        )}
      </div>

      {announcement.category && (
        <div className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mb-3">
          {announcement.category}
        </div>
      )}

      <p className="text-gray-600 mb-4 line-clamp-3">{announcement.description}</p>

      <div className="space-y-2 mb-4 text-sm text-gray-500">
        {announcement.location && (
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{announcement.location}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>{new Date(announcement.created_at).toLocaleDateString("ru-RU")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye size={16} />
          <span>{announcement.views_count} просмотров</span>
        </div>
      </div>

      {!showContacts ? (
        <Button onClick={handleShowContacts} className="w-full bg-transparent" variant="outline">
          Показать контакты
        </Button>
      ) : (
        <div className="space-y-2 border-t pt-4">
          <div className="font-semibold text-gray-900 mb-2">{announcement.contact_name}</div>
          <a
            href={`tel:${announcement.contact_phone}`}
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <Phone size={16} />
            {announcement.contact_phone}
          </a>
          <a
            href={`mailto:${announcement.contact_email}`}
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <Mail size={16} />
            {announcement.contact_email}
          </a>
          {announcement.contact_whatsapp && (
            <a
              href={`https://wa.me/${announcement.contact_whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-600 hover:underline"
            >
              <Phone size={16} />
              WhatsApp: {announcement.contact_whatsapp}
            </a>
          )}
          {announcement.contact_telegram && (
            <a
              href={`https://t.me/${announcement.contact_telegram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Send size={16} />
              {announcement.contact_telegram}
            </a>
          )}
        </div>
      )}
    </Card>
  )
}
