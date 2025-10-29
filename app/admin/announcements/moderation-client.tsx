"use client"

import { useState } from "react"
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
import { Check, X, Eye, Phone, MapPin, Calendar, TrendingUp, Clock } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase-client"

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

export default function AnnouncementsModerationClient({
  initialAnnouncements,
}: {
  initialAnnouncements: Announcement[]
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const supabase = createBrowserClient()

  const pendingAnnouncements = announcements.filter((a) => !a.is_moderated)
  const approvedAnnouncements = announcements.filter((a) => a.is_moderated && a.is_active)
  const rejectedAnnouncements = announcements.filter((a) => a.is_moderated && !a.is_active)

  const filterAnnouncements = (list: Announcement[]) => {
    if (!searchQuery) return list
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.contact_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("announcements")
      .update({
        is_moderated: true,
        is_active: true,
        moderated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (!error) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, is_moderated: true, is_active: true, moderated_at: new Date().toISOString() } : a,
        ),
      )
    }
  }

  const handleReject = async () => {
    if (!selectedAnnouncement) return

    const { error } = await supabase
      .from("announcements")
      .update({
        is_moderated: true,
        is_active: false,
        moderated_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq("id", selectedAnnouncement.id)

    if (!error) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === selectedAnnouncement.id
            ? {
                ...a,
                is_moderated: true,
                is_active: false,
                moderated_at: new Date().toISOString(),
                rejection_reason: rejectionReason,
              }
            : a,
        ),
      )
      setIsRejectDialogOpen(false)
      setSelectedAnnouncement(null)
      setRejectionReason("")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это объявление?")) return

    const { error } = await supabase.from("announcements").delete().eq("id", id)

    if (!error) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    }
  }

  const openRejectDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setIsRejectDialogOpen(true)
  }

  const getDaysUntilExpiration = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Модерация объявлений</h1>
        <p className="text-gray-600">Управление текстовыми объявлениями пользователей</p>
      </div>

      {/* Statistics */}
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

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Поиск по объявлениям..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">На модерации ({pendingAnnouncements.length})</TabsTrigger>
          <TabsTrigger value="approved">Одобренные ({approvedAnnouncements.length})</TabsTrigger>
          <TabsTrigger value="rejected">Отклоненные ({rejectedAnnouncements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {filterAnnouncements(pendingAnnouncements).map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onApprove={handleApprove}
                onReject={openRejectDialog}
                onDelete={handleDelete}
                showActions
              />
            ))}
            {filterAnnouncements(pendingAnnouncements).length === 0 && (
              <p className="text-center text-gray-500 py-8">Нет объявлений на модерации</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="space-y-4">
            {filterAnnouncements(approvedAnnouncements).map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} onDelete={handleDelete} showStats />
            ))}
            {filterAnnouncements(approvedAnnouncements).length === 0 && (
              <p className="text-center text-gray-500 py-8">Нет одобренных объявлений</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="space-y-4">
            {filterAnnouncements(rejectedAnnouncements).map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onDelete={handleDelete}
                showRejectionReason
              />
            ))}
            {filterAnnouncements(rejectedAnnouncements).length === 0 && (
              <p className="text-center text-gray-500 py-8">Нет отклоненных объявлений</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить объявление</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения объявления. Эта информация будет сохранена в системе.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection_reason">Причина отклонения</Label>
            <Textarea
              id="rejection_reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Например: Нарушение правил размещения, недостоверная информация..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason}>
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AnnouncementCard({
  announcement,
  onApprove,
  onReject,
  onDelete,
  showActions = false,
  showStats = false,
  showRejectionReason = false,
}: {
  announcement: Announcement
  onApprove?: (id: string) => void
  onReject?: (announcement: Announcement) => void
  onDelete?: (id: string) => void
  showActions?: boolean
  showStats?: boolean
  showRejectionReason?: boolean
}) {
  const daysUntilExpiration = Math.ceil(
    (new Date(announcement.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )

  return (
    <Card className="p-6">
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
          <div className="text-xl font-bold text-blue-600 ml-4">{announcement.price.toLocaleString("ru-RU")} ₽</div>
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
          <Button onClick={() => onApprove(announcement.id)} className="bg-green-600 hover:bg-green-700">
            <Check size={16} className="mr-2" />
            Одобрить
          </Button>
        )}
        {showActions && onReject && (
          <Button onClick={() => onReject(announcement)} variant="destructive">
            <X size={16} className="mr-2" />
            Отклонить
          </Button>
        )}
        {onDelete && (
          <Button onClick={() => onDelete(announcement.id)} variant="outline">
            Удалить
          </Button>
        )}
      </div>
    </Card>
  )
}
