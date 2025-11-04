"use client"

import type React from "react"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TextOverlayEditor from "./text-overlay-editor"  // ← измените путь
import CollageEditor from "./collage-editor"          // ← измените путь

interface Advertisement {
  id: string
  title: string
  description: string
  image_url: string
  button_text: string
  button_url: string
  is_active: boolean
  start_date: string
  end_date: string
  display_duration_seconds: number
  close_delay_seconds: number
  max_shows_per_day: number
  position: string
  width: string
  height: string
  background_color: string
  background_opacity: number
  text_color: string
  button_color: string
  text_overlay: any
  collage_config: any
  collage_mode: boolean
  shows_today?: number
  total_views?: number
  total_clicks?: number
  last_shown_at?: string
}

export default function AdvertisementEditClient({ advertisement }: { advertisement: Advertisement }) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState<Advertisement>(advertisement)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Название обязательно"
    }

    if (formData.display_duration_seconds < 1) {
      newErrors.display_duration_seconds = "Продолжительность должна быть не менее 1 секунды"
    }

    if (formData.close_delay_seconds < 0) {
      newErrors.close_delay_seconds = "Задержка не может быть отрицательной"
    }

    if (formData.max_shows_per_day < 1) {
      newErrors.max_shows_per_day = "Максимум показов должен быть не менее 1"
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      newErrors.end_date = "Дата окончания должна быть позже даты начала"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    const processedValue = type === "checkbox"
      ? checked
      : type === "number"
        ? Number(value)
        : name === "background_opacity"
          ? Math.max(0, Math.min(1, Number.parseFloat(value) || 0.8))
          : value

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }))

    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleTextOverlayChange = (textOverlay: any) => {
    setFormData((prev) => ({
      ...prev,
      text_overlay: textOverlay,
    }))
  }

  const handleCollageChange = (collageConfig: any) => {
    setFormData((prev) => ({
      ...prev,
      collage_config: collageConfig,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      alert("Пожалуйста, исправьте ошибки в форме")
      return
    }

    try {
      setIsLoading(true)

      // Подготовка данных для обновления
      const updateData = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        button_text: formData.button_text,
        button_url: formData.button_url,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        display_duration_seconds: formData.display_duration_seconds,
        close_delay_seconds: formData.close_delay_seconds,
        max_shows_per_day: formData.max_shows_per_day,
        position: formData.position,
        width: formData.width,
        height: formData.height,
        background_color: formData.background_color,
        background_opacity: formData.background_opacity,
        text_color: formData.text_color,
        button_color: formData.button_color,
        collage_mode: formData.collage_mode,
        updated_at: new Date().toISOString(),
        // Обработка JSON полей
        text_overlay: formData.text_overlay && Object.keys(formData.text_overlay).length > 0
          ? JSON.stringify(formData.text_overlay)
          : null,
        collage_config: formData.collage_config && Object.keys(formData.collage_config).length > 0
          ? JSON.stringify(formData.collage_config)
          : null,
      }

      const { error } = await supabase
        .from("advertisements")
        .update(updateData)
        .eq("id", formData.id)

      if (error) {
        console.error("Error updating advertisement:", error)
        throw error
      }

      alert("Реклама успешно обновлена")
      router.push("/admin/advertisements")
      router.refresh() // Обновляем данные на странице
    } catch (error) {
      console.error("Error updating advertisement:", error)
      alert("Ошибка при обновлении рекламы")
    } finally {
      setIsLoading(false)
    }
  }

  const resetStatistics = async () => {
    if (!confirm("Вы уверены, что хотите сбросить статистику? Это действие нельзя отменить.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("advertisements")
        .update({
          shows_today: 0,
          total_views: 0,
          total_clicks: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", formData.id)

      if (error) throw error

      alert("Статистика сброшена")
      // Обновляем локальные данные
      setFormData(prev => ({
        ...prev,
        shows_today: 0,
        total_views: 0,
        total_clicks: 0,
      }))
    } catch (error) {
      console.error("Error resetting statistics:", error)
      alert("Ошибка при сбросе статистики")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="text">Текст на фото</TabsTrigger>
          <TabsTrigger value="collage">Коллаж</TabsTrigger>
          <TabsTrigger value="settings">Параметры</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="bg-white rounded-lg shadow p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Основная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Название рекламы"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Описание рекламы"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL изображения</label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.image_url && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Предпросмотр:</p>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="max-w-xs max-h-48 rounded-lg object-cover border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Кнопка действия</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Текст кнопки</label>
                <input
                  type="text"
                  name="button_text"
                  value={formData.button_text}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Подробнее"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL ссылки</label>
                <input
                  type="url"
                  name="button_url"
                  value={formData.button_url}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text" className="bg-white rounded-lg shadow p-8">
          <TextOverlayEditor
            imageUrl={formData.image_url}
            textOverlay={formData.text_overlay}
            onChange={handleTextOverlayChange}
          />
        </TabsContent>

        <TabsContent value="collage" className="bg-white rounded-lg shadow p-8">
          <CollageEditor collageConfig={formData.collage_config} onChange={handleCollageChange} />
        </TabsContent>

        <TabsContent value="settings" className="bg-white rounded-lg shadow p-8 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Настройки времени</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Начало показа</label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date ? formData.start_date.slice(0, 16) : ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Конец показа</label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date ? formData.end_date.slice(0, 16) : ""}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.end_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Продолжительность показа (сек) *</label>
                <input
                  type="number"
                  name="display_duration_seconds"
                  value={formData.display_duration_seconds}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.display_duration_seconds ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="1"
                />
                {errors.display_duration_seconds && (
                  <p className="text-red-500 text-sm mt-1">{errors.display_duration_seconds}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Задержка до закрытия (сек)</label>
                <input
                  type="number"
                  name="close_delay_seconds"
                  value={formData.close_delay_seconds}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.close_delay_seconds ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                />
                {errors.close_delay_seconds && (
                  <p className="text-red-500 text-sm mt-1">{errors.close_delay_seconds}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Частота показа</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Максимум показов в день *</label>
              <input
                type="number"
                name="max_shows_per_day"
                value={formData.max_shows_per_day}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.max_shows_per_day ? 'border-red-500' : 'border-gray-300'
                }`}
                min="1"
              />
              {errors.max_shows_per_day && <p className="text-red-500 text-sm mt-1">{errors.max_shows_per_day}</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Стилизация</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Позиция</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="center">По центру</option>
                  <option value="top">Сверху</option>
                  <option value="bottom">Снизу</option>
                  <option value="top-left">Сверху слева</option>
                  <option value="top-right">Сверху справа</option>
                  <option value="bottom-left">Снизу слева</option>
                  <option value="bottom-right">Снизу справа</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ширина</label>
                <input
                  type="text"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="800px или 90vw"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Высота</label>
                <input
                  type="text"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="400px или 80vh"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет фона</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="background_color"
                    value={formData.background_color}
                    onChange={handleChange}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    name="background_color"
                    value={formData.background_color}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Прозрачность фона: {Math.round((formData.background_opacity || 0.8) * 100)}%
                </label>
                <input
                  type="range"
                  name="background_opacity"
                  value={formData.background_opacity || 0.8}
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет текста</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="text_color"
                    value={formData.text_color}
                    onChange={handleChange}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    name="text_color"
                    value={formData.text_color}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет кнопки</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="button_color"
                    value={formData.button_color}
                    onChange={handleChange}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    name="button_color"
                    value={formData.button_color}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="#007bff"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Активировать рекламу</span>
                <p className="text-sm text-gray-500">Реклама будет показываться пользователям</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Статистика</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Показов сегодня:</span>
                  <p className="font-semibold">{formData.shows_today || 0}</p>
                </div>
                <div>
                  <span className="text-blue-700">Всего просмотров:</span>
                  <p className="font-semibold">{formData.total_views || 0}</p>
                </div>
                <div>
                  <span className="text-blue-700">Всего кликов:</span>
                  <p className="font-semibold">{formData.total_clicks || 0}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetStatistics}
                className="mt-3 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Сбросить статистику
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-6 border-t bg-white rounded-lg shadow p-6">
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Сохранение..." : "Сохранить рекламу"}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push("/admin/advertisements")}
          disabled={isLoading}
        >
          Отмена
        </Button>
      </div>
    </form>
  )
}
