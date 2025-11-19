"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function EditOfferClient({ initialOffer }: { initialOffer: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [offer, setOffer] = useState(initialOffer)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Следим за изменениями
  useEffect(() => {
    const isChanged = JSON.stringify(offer) !== JSON.stringify(initialOffer)
    setHasChanges(isChanged)
  }, [offer, initialOffer])

  // Валидация формы
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!offer.title?.trim()) {
      newErrors.title = "Название обязательно"
    }

    if (!offer.price || offer.price < 0) {
      newErrors.price = "Цена должна быть положительным числом"
    }

    if (offer.image_url && !isValidUrl(offer.image_url)) {
      newErrors.image_url = "Некорректный URL"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/commercial-offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offer),
      })

      if (response.ok) {
        alert("Коммерческое предложение обновлено")
        router.push("/admin/commercial-offers")
        router.refresh()
      } else {
        const errorData = await response.json()
        alert(errorData.message || "Ошибка при сохранении")
      }
    } catch (error) {
      console.error("[EditOffer] Error saving offer:", error)
      alert("Ошибка подключения к серверу")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Вы уверены, что хотите удалить это коммерческое предложение?")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/commercial-offers/${offer.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Коммерческое предложение удалено")
        router.push("/admin/commercial-offers")
        router.refresh()
      } else {
        alert("Ошибка при удалении")
      }
    } catch (error) {
      console.error("[EditOffer] Error deleting offer:", error)
      alert("Ошибка подключения к серверу")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setOffer(prev => ({ ...prev, [field]: value }))
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Заголовок и навигация */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Редактировать КП</h1>
            <p className="text-gray-600 mt-2">ID: {offer.id}</p>
          </div>
          <Link href="/admin/commercial-offers">
            <Button variant="outline" className="flex items-center gap-2">
              ← Назад к списку
            </Button>
          </Link>
        </div>

        {/* Основная форма */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8">
          {/* Основная информация */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
              Основная информация
            </h2>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700 mb-2">
                  Название техники *
                </Label>
                <Input
                  id="title"
                  value={offer.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Например: Седельный тягач Volvo FH 500"
                  className={errors.title ? "border-red-500 focus:border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2">
                  Описание
                </Label>
                <Textarea
                  id="description"
                  value={offer.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Подробное описание техники и её преимуществ"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Цены */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
              Стоимость
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price" className="text-sm font-medium text-gray-700 mb-2">
                  Цена (руб.) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={offer.price || 0}
                  onChange={(e) => handleInputChange("price", parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className={errors.price ? "border-red-500 focus:border-red-500" : ""}
                />
                {errors.price && (
                  <p className="text-red-600 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              <div>
                <Label htmlFor="price_with_vat" className="text-sm font-medium text-gray-700 mb-2">
                  Цена с НДС (руб.)
                </Label>
                <Input
                  id="price_with_vat"
                  type="number"
                  value={offer.price_with_vat || 0}
                  onChange={(e) => handleInputChange("price_with_vat", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Медиа */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
              Медиафайлы
            </h2>
            
            <div>
              <Label htmlFor="image_url" className="text-sm font-medium text-gray-700 mb-2">
                URL фото техники
              </Label>
              <Input
                id="image_url"
                value={offer.image_url || ""}
                onChange={(e) => handleInputChange("image_url", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={errors.image_url ? "border-red-500 focus:border-red-500" : ""}
              />
              {errors.image_url && (
                <p className="text-red-600 text-sm mt-1">{errors.image_url}</p>
              )}
              {offer.image_url && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Предпросмотр:</p>
                  <div className="border border-gray-300 rounded-lg overflow-hidden max-w-xs">
                    <img 
                      src={offer.image_url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Дополнительные настройки */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
              Дополнительные настройки
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Активное предложение
                  </Label>
                  <p className="text-sm text-gray-500">
                    Будет отображаться в списке коммерческих предложений
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={offer.is_active !== false}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Рекомендуемое
                  </Label>
                  <p className="text-sm text-gray-500">
                    Выделить в списке как рекомендуемое предложение
                  </p>
                </div>
                <Switch
                  id="featured"
                  checked={offer.is_featured || false}
                  onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
                />
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isLoading || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Сохранение...
                  </div>
                ) : (
                  "Сохранить изменения"
                )}
              </Button>
              
              <Link href="/admin/commercial-offers">
                <Button variant="outline">Отмена</Button>
              </Link>
            </div>

            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? "Удаление..." : "Удалить КП"}
            </Button>
          </div>

          {/* Индикатор изменений */}
          {hasChanges && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Есть несохраненные изменения
              </p>
            </div>
          )}
        </div>

        {/* Мета-информация */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о записи</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Создано:</span>
              <span className="ml-2 text-gray-900">
                {offer.created_at ? new Date(offer.created_at).toLocaleString('ru-RU') : 'Не указано'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Обновлено:</span>
              <span className="ml-2 text-gray-900">
                {offer.updated_at ? new Date(offer.updated_at).toLocaleString('ru-RU') : 'Не указано'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
