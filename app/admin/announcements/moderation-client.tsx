"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Check, X, Eye, Phone, MapPin, Calendar, TrendingUp, Clock, Search, Download, Loader2, RefreshCw } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  is_active: boolean
  is_moderated: boolean
  moderated_at: string | null
  rejection_reason: string | null
  views_count: number
  contact_clicks: number
  created_at: string
  expires_at: string
}

export default function AnnouncementsModerationClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient()

  // Простая функция загрузки данных
  const loadAnnouncements = async () => {
    console.log("🔄 Загрузка объявлений...")
    setIsRefreshing(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Ошибка Supabase:", error)
        setError(`Ошибка загрузки: ${error.message}`)
        return
      }

      console.log("✅ Данные загружены:", data)
      console.log("📊 Статистика:")
      console.log("- Всего объявлений:", data?.length || 0)
      
      // ВАЖНО: Логируем ВСЕ объявления и их статусы
      if (data && data.length > 0) {
        data.forEach(ann => {
          console.log(`  - ${ann.title}: is_moderated=${ann.is_moderated}, is_active=${ann.is_active}`)
        })
      }

      setAnnouncements(data || [])
      
    } catch (err) {
      console.error("❌ Неожиданная ошибка:", err)
      setError("Произошла непредвиденная ошибка при загрузке данных")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Загрузка при монтировании
  useEffect(() => {
    loadAnnouncements()
  }, [])

  // ИСПРАВЛЕННАЯ ФИЛЬТРАЦИЯ - только по is_moderated
  const pendingAnnouncements = announcements.filter(a => !a.is_moderated)
  const approvedAnnouncements = announcements.filter(a => a.is_moderated && a.is_active)
  const rejectedAnnouncements = announcements.filter(a => a.is_moderated && !a.is_active)

  console.log("🔍 ФИЛЬТРАЦИЯ:")
  console.log("- На модерации (!is_moderated):", pendingAnnouncements.length)
  console.log("- Одобренные (is_moderated && is_active):", approvedAnnouncements.length)
  console.log("- Отклоненные (is_moderated && !is_active):", rejectedAnnouncements.length)

  const filteredPending = pendingAnnouncements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.contact_phone.includes(searchQuery)
  )

  const handleApprove = async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("✅ Одобрение объявления:", id)

      const { error } = await supabase
        .from("announcements")
        .update({
          is_moderated: true,
          is_active: true,
          moderated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        throw new Error(error.message)
      }

      console.log("✅ Объявление успешно одобрено")
      
      // Перезагружаем данные
      await loadAnnouncements()
      
    } catch (err: any) {
      console.error("❌ Ошибка при одобрении:", err)
      setError(`Ошибка при одобрении: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedAnnouncement) return

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("announcements")
        .update({
          is_moderated: true,
          is_active: false,
          moderated_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedAnnouncement.id)

      if (error) {
        throw new Error(error.message)
      }

      console.log("✅ Объявление отклонено")
      
      // Перезагружаем данные
      await loadAnnouncements()
      
      setIsRejectDialogOpen(false)
      setSelectedAnnouncement(null)
      setRejectionReason("")
      
    } catch (err: any) {
      console.error("❌ Ошибка при отклонении:", err)
      setError(`Ошибка при отклонении: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.")) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("🗑️ Удаление объявления:", id)

      const { error } = await supabase.from("announcements").delete().eq("id", id)

      if (error) {
        throw new Error(error.message)
      }

      console.log("✅ Объявление успешно удалено")
      
      // Перезагружаем данные
      await loadAnnouncements()
      
    } catch (err: any) {
      console.error("❌ Ошибка при удалении:", err)
      setError(`Ошибка при удалении: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const openRejectDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setIsRejectDialogOpen(true)
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Модерация объявлений</h1>
          <p className="text-gray-600">Управление текстовыми объявлениями пользователей</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={loadAnnouncements} 
            variant="outline" 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Обновить
          </Button>
          <div className="text-sm text-gray-500">
            Всего: {announcements.length} | На модерации: {pendingAnnouncements.length}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <Button 
            onClick={loadAnnouncements} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Попробовать снова
          </Button>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">На модерации</p>
              <p className="text-3xl font-bold text-orange-600">{pendingAnnouncements.length}</p>
            </div>
            <Clock className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Одобрено</p>
              <p className="text-3xl font-bold text-green-600">{approvedAnnouncements.length}</p>
            </div>
            <Check className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Отклонено</p>
              <p className="text-3xl font-bold text-red-600">{rejectedAnnouncements.length}</p>
            </div>
            <X className="w-12 h-12 text-red-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Всего просмотров</p>
              <p className="text-3xl font-bold text-blue-600">
                {announcements.reduce((sum, a) => sum + a.views_count, 0)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Поиск */}
      <div className="mb-6">
        <Label htmlFor="search" className="mb-2 block">Поиск по объявлениям</Label>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="search"
            type="text"
            placeholder="Поиск по заголовку, описанию, имени или телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Вкладки */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            На модерации ({pendingAnnouncements.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Одобренные ({approvedAnnouncements.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Отклоненные ({rejectedAnnouncements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {filteredPending.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onApprove={handleApprove}
                onReject={openRejectDialog}
                onDelete={handleDelete}
                showActions
                isLoading={isLoading}
              />
            ))}
            {filteredPending.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                {isRefreshing ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Загрузка объявлений...</span>
                  </div>
                ) : pendingAnnouncements.length === 0 ? (
                  "Нет объявлений на модерации"
                ) : (
                  "Объявления не найдены по вашему запросу"
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="space-y-4">
            {approvedAnnouncements.map((announcement) => (
              <AnnouncementCard 
                key={announcement.id} 
                announcement={announcement} 
                onDelete={handleDelete}
                showStats
                isLoading={isLoading}
              />
            ))}
            {approvedAnnouncements.length === 0 && (
              <p className="text-center text-gray-500 py-12">Нет одобренных объявлений</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="space-y-4">
            {rejectedAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onDelete={handleDelete}
                showRejectionReason
                isLoading={isLoading}
              />
            ))}
            {rejectedAnnouncements.length === 0 && (
              <p className="text-center text-gray-500 py-12">Нет отклоненных объявлений</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Диалог отклонения */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить объявление</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения объявления. Эта информация будет сохранена в системе.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection_reason">Причина отклонения *</Label>
            <Textarea
              id="rejection_reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Например: Нарушение правил размещения, недостоверная информация, неполные данные..."
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isLoading}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason || isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Компонент AnnouncementCard остается без изменений
function AnnouncementCard({
  announcement,
  onApprove,
  onReject,
  onDelete,
  showActions = false,
  showStats = false,
  showRejectionReason = false,
  isLoading = false,
}: {
  announcement: Announcement
  onApprove?: (id: string) => void
  onReject?: (announcement: Announcement) => void
  onDelete?: (id: string) => void
  showActions?: boolean
  showStats?: boolean
  showRejectionReason?: boolean
  isLoading?: boolean
}) {
  const daysUntilExpiration = Math.ceil(
    (new Date(announcement.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      RUB: "₽",
      USD: "$",
      EUR: "€",
      CNY: "¥",
    }
    return symbols[currency] || currency
  }

  return (
    <Card className="p-6">
      <div className="flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={announcement.type === "demand" ? "default" : "secondary"}>
                {announcement.type === "demand" ? "Спрос" : "Предложение"}
              </Badge>
              {announcement.category && <Badge variant="outline">{announcement.category}</Badge>}
              {showStats && daysUntilExpiration <= 7 && (
                <Badge variant="destructive">Истекает через {daysUntilExpiration} дн.</Badge>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{announcement.title}</h3>
            <p className="text-gray-600 mb-4">{announcement.description}</p>
          </div>
          {announcement.price && (
            <div className="text-xl font-bold text-blue-600 ml-4">
              {announcement.price.toLocaleString("ru-RU")} {getCurrencySymbol(announcement.currency)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={16} />
            <span>{announcement.location || "Не указано"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={16} />
            <span>{new Date(announcement.created_at).toLocaleDateString("ru-RU")}</span>
          </div>
          {showStats && (
            <>
              <div className="flex items-center gap-2 text-gray-600">
                <Eye size={16} />
                <span>{announcement.views_count} просмотров</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} />
                <span>{announcement.contact_clicks} кликов</span>
              </div>
            </>
          )}
        </div>

        <div className="border-t pt-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Контактная информация:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Имя:</span> {announcement.contact_name}
            </div>
            <div>
              <span className="text-gray-600">Телефон:</span> {announcement.contact_phone}
            </div>
            <div>
              <span className="text-gray-600">Email:</span> {announcement.contact_email}
            </div>
            {announcement.contact_whatsapp && (
              <div>
                <span className="text-gray-600">WhatsApp:</span>{" "}
                <a
                  href={`https://wa.me/${announcement.contact_whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  {announcement.contact_whatsapp}
                </a>
              </div>
            )}
            {announcement.contact_telegram && (
              <div>
                <span className="text-gray-600">Telegram:</span> {announcement.contact_telegram}
              </div>
            )}
          </div>
        </div>

        {showRejectionReason && announcement.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-red-800 mb-1">Причина отклонения:</p>
            <p className="text-sm text-red-700">{announcement.rejection_reason}</p>
          </div>
        )}

        <div className="flex gap-2">
          {showActions && onApprove && (
            <Button 
              onClick={() => onApprove(announcement.id)} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check size={16} className="mr-2" />}
              Одобрить
            </Button>
          )}
          {showActions && onReject && (
            <Button 
              onClick={() => onReject(announcement)} 
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X size={16} className="mr-2" />}
              Отклонить
            </Button>
          )}
          {onDelete && (
            <Button 
              onClick={() => onDelete(announcement.id)} 
              variant="outline"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Удалить"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
