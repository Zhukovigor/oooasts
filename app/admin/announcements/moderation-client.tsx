"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Check, X, Eye, Phone, MapPin, Calendar, TrendingUp, Clock, Search, Download, Loader2 } from "lucide-react"
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

type Filters = {
  type: "demand" | "supply" | "all"
  category: string
  dateRange: {
    from: string
    to: string
  }
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<Filters>({
    type: "all",
    category: "all",
    dateRange: { from: "", to: "" }
  })

  const itemsPerPage = 10
  const supabase = createBrowserClient()

  // Реальное время обновление
  useEffect(() => {
    const channel = supabase
      .channel('announcements-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'announcements' 
        },
        (payload) => {
          console.log('Real-time update:', payload)
          // В реальном приложении здесь нужно обновить данные
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const pendingAnnouncements = announcements.filter((a) => !a.is_moderated)
  const approvedAnnouncements = announcements.filter((a) => a.is_moderated && a.is_active)
  const rejectedAnnouncements = announcements.filter((a) => a.is_moderated && !a.is_active)

  // Мемоизированная фильтрация
  const filterAnnouncements = useMemo(() => {
    return (list: Announcement[]) => {
      let filtered = list

      if (searchQuery) {
        filtered = filtered.filter(
          (a) =>
            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.contact_phone.includes(searchQuery)
        )
      }

      if (filters.type !== "all") {
        filtered = filtered.filter(a => a.type === filters.type)
      }

      if (filters.category !== "all" && filters.category) {
        filtered = filtered.filter(a => a.category === filters.category)
      }

      if (filters.dateRange.from) {
        filtered = filtered.filter(a => new Date(a.created_at) >= new Date(filters.dateRange.from))
      }

      if (filters.dateRange.to) {
        filtered = filtered.filter(a => new Date(a.created_at) <= new Date(filters.dateRange.to))
      }

      return filtered
    }
  }, [searchQuery, filters])

  // Пагинация
  const getPaginatedAnnouncements = (list: Announcement[]) => {
    const filtered = filterAnnouncements(list)
    const startIndex = (currentPage - 1) * itemsPerPage
    return {
      data: filtered.slice(startIndex, startIndex + itemsPerPage),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / itemsPerPage)
    }
  }

  const handleApprove = async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("Одобрение объявления:", id)

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

      console.log("Объявление успешно одобрено")
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, is_moderated: true, is_active: true, moderated_at: new Date().toISOString() } : a,
        ),
      )
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
    } catch (err) {
      console.error("Ошибка при одобрении:", err)
      setError(`Ошибка при одобрении: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from("announcements")
        .update({
          is_moderated: true,
          is_active: true,
          moderated_at: new Date().toISOString(),
        })
        .in("id", selectedIds)

      if (error) {
        throw new Error(error.message)
      }

      setAnnouncements((prev) =>
        prev.map((a) =>
          selectedIds.includes(a.id) 
            ? { ...a, is_moderated: true, is_active: true, moderated_at: new Date().toISOString() } 
            : a,
        ),
      )
      setSelectedIds([])
    } catch (err) {
      console.error("Ошибка при массовом одобрении:", err)
      setError(`Ошибка при массовом одобрении: ${err.message}`)
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
      setSelectedIds(prev => prev.filter(id => id !== selectedAnnouncement.id))
    } catch (err) {
      console.error("Ошибка при отклонении:", err)
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
      console.log("Удаление объявления:", id)

      const { error } = await supabase.from("announcements").delete().eq("id", id)

      if (error) {
        throw new Error(error.message)
      }

      console.log("Объявление успешно удалено:", id)
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id))
    } catch (err) {
      console.error("Ошибка при удалении:", err)
      setError(`Ошибка при удалении: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const openRejectDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setIsRejectDialogOpen(true)
  }

  const exportToCSV = (announcements: Announcement[]) => {
    const headers = ["ID", "Тип", "Заголовок", "Категория", "Цена", "Статус", "Дата создания", "Контакты"]
    const csvContent = [
      headers.join(","),
      ...announcements.map(a => [
        a.id,
        a.type === "demand" ? "Спрос" : "Предложение",
        `"${a.title.replace(/"/g, '""')}"`,
        a.category || "Не указана",
        a.price ? `${a.price} ${a.currency}` : "Не указана",
        !a.is_moderated ? "На модерации" : a.is_active ? "Одобрено" : "Отклонено",
        new Date(a.created_at).toLocaleDateString("ru-RU"),
        a.contact_phone
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `объявления_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleSelectAll = (list: Announcement[]) => {
    const filteredIds = filterAnnouncements(list).map(a => a.id)
    if (selectedIds.length === filteredIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredIds)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const getUniqueCategories = () => {
    const categories = announcements
      .map(a => a.category)
      .filter(Boolean) as string[]
    return Array.from(new Set(categories))
  }

  const pendingPaginated = getPaginatedAnnouncements(pendingAnnouncements)
  const approvedPaginated = getPaginatedAnnouncements(approvedAnnouncements)
  const rejectedPaginated = getPaginatedAnnouncements(rejectedAnnouncements)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Модерация объявлений</h1>
        <p className="text-gray-600">Управление текстовыми объявлениями пользователей</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
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

      {/* Поиск и фильтры */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1">
            <Label htmlFor="search" className="mb-2 block">Поиск по объявлениям</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                type="text"
                placeholder="Поиск по заголовку, описанию, имени или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="type-filter" className="mb-2 block">Тип</Label>
            <Select value={filters.type} onValueChange={(value: "demand" | "supply" | "all") => setFilters(prev => ({...prev, type: value}))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="demand">Спрос</SelectItem>
                <SelectItem value="supply">Предложение</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category-filter" className="mb-2 block">Категория</Label>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({...prev, category: value}))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {getUniqueCategories().map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => exportToCSV(announcements)} 
            variant="outline" 
            disabled={isLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт CSV
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <Label htmlFor="date-from" className="mb-2 block">Дата от</Label>
            <Input
              id="date-from"
              type="date"
              value={filters.dateRange.from}
              onChange={(e) => setFilters(prev => ({
                ...prev, 
                dateRange: {...prev.dateRange, from: e.target.value}
              }))}
              className="w-40"
            />
          </div>
          <div>
            <Label htmlFor="date-to" className="mb-2 block">Дата до</Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateRange.to}
              onChange={(e) => setFilters(prev => ({
                ...prev, 
                dateRange: {...prev.dateRange, to: e.target.value}
              }))}
              className="w-40"
            />
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => toggleSelectAll(pendingAnnouncements)}
                variant="outline"
                size="sm"
              >
                {selectedIds.length === filterAnnouncements(pendingAnnouncements).length ? "Снять выделение" : "Выделить все"}
              </Button>
              
              {selectedIds.length > 0 && (
                <Button
                  onClick={handleBulkApprove}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Одобрить выбранные ({selectedIds.length})
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-600">
              Страница {currentPage} из {pendingPaginated.totalPages}
            </div>
          </div>

          <div className="space-y-4">
            {pendingPaginated.data.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onApprove={handleApprove}
                onReject={openRejectDialog}
                onDelete={handleDelete}
                isSelected={selectedIds.includes(announcement.id)}
                onSelect={toggleSelect}
                showActions
                isLoading={isLoading}
              />
            ))}
            {pendingPaginated.data.length === 0 && (
              <p className="text-center text-gray-500 py-8">Нет объявлений на модерации</p>
            )}
          </div>

          {pendingPaginated.totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Страница {currentPage} из {pendingPaginated.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(pendingPaginated.totalPages, prev + 1))}
                disabled={currentPage === pendingPaginated.totalPages}
              >
                Вперед
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Страница {currentPage} из {approvedPaginated.totalPages}
            </div>
          </div>

          <div className="space-y-4">
            {approvedPaginated.data.map((announcement) => (
              <AnnouncementCard 
                key={announcement.id} 
                announcement={announcement} 
                onDelete={handleDelete}
                showStats
                isLoading={isLoading}
              />
            ))}
            {approvedPaginated.data.length === 0 && (
              <p className="text-center text-gray-500 py-8">Нет одобренных объявлений</p>
            )}
          </div>

          {approvedPaginated.totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Страница {currentPage} из {approvedPaginated.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(approvedPaginated.totalPages, prev + 1))}
                disabled={currentPage === approvedPaginated.totalPages}
              >
                Вперед
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Страница {currentPage} из {rejectedPaginated.totalPages}
            </div>
          </div>

          <div className="space-y-4">
            {rejectedPaginated.data.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onDelete={handleDelete}
                showRejectionReason
                isLoading={isLoading}
              />
            ))}
            {rejectedPaginated.data.length === 0 && (
              <p className="text-center text-gray-500 py-8">Нет отклоненных объявлений</p>
            )}
          </div>

          {rejectedPaginated.totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Страница {currentPage} из {rejectedPaginated.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(rejectedPaginated.totalPages, prev + 1))}
                disabled={currentPage === rejectedPaginated.totalPages}
              >
                Вперед
              </Button>
            </div>
          )}
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

function AnnouncementCard({
  announcement,
  onApprove,
  onReject,
  onDelete,
  onSelect,
  isSelected = false,
  showActions = false,
  showStats = false,
  showRejectionReason = false,
  isLoading = false,
}: {
  announcement: Announcement
  onApprove?: (id: string) => void
  onReject?: (announcement: Announcement) => void
  onDelete?: (id: string) => void
  onSelect?: (id: string) => void
  isSelected?: boolean
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
    <Card className={`p-6 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start gap-4">
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(announcement.id)}
            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        )}
        
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
      </div>
    </Card>
  )
}
