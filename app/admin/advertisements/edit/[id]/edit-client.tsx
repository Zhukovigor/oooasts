"use client"

import type React from "react"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TextOverlayEditor from "@/components/advertisement/text-overlay-editor"
import CollageEditor from "@/components/advertisement/collage-editor"

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
  background_color: string
  text_color: string
  button_color: string
  text_overlay: any
  collage_config: any
  collage_mode: boolean
}

export default function AdvertisementEditClient({ advertisement }: { advertisement: Advertisement }) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState<Advertisement>(advertisement)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }))
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

    if (!formData.title.trim()) {
      alert("Пожалуйста, введите название")
      return
    }

    try {
      setIsLoading(true)
      const updateData = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        button_text: formData.button_text,
        button_url: formData.button_url,
        is_active: formData.is_active,
        start_date: formData.start_date,
        end_date: formData.end_date,
        display_duration_seconds: formData.display_duration_seconds,
        close_delay_seconds: formData.close_delay_seconds,
        max_shows_per_day: formData.max_shows_per_day,
        position: formData.position,
        width: formData.width,
        background_color: formData.background_color,
        text_color: formData.text_color,
        button_color: formData.button_color,
        text_overlay: formData.text_overlay
          ? typeof formData.text_overlay === "string"
            ? formData.text_overlay
            : JSON.stringify(formData.text_overlay)
          : null,
        collage_config: formData.collage_config
          ? typeof formData.collage_config === "string"
            ? formData.collage_config
            : JSON.stringify(formData.collage_config)
          : null,
        collage_mode: formData.collage_mode,
      }

      console.log("[v0] Updating advertisement:", formData.id, updateData)

      const { error, data } = await supabase.from("advertisements").update(updateData).eq("id", formData.id).select()

      if (error) {
        console.error("[v0] Supabase error:", error)
        throw error
      }

      console.log("[v0] Update successful:", data)
      alert("Реклама успешно обновлена")
      router.push("/admin/advertisements")
    } catch (error) {
      console.error("[v0] Error updating ad:", error)
      alert("Ошибка при обновлении рекламы: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsLoading(false)
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Название рекламы"
                />
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
                  <img
                    src={formData.image_url || "/placeholder.svg"}
                    alt="Preview"
                    className="mt-4 max-w-xs max-h-48 rounded-lg object-cover"
                  />
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
            <div className="grid grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Продолжительность показа (сек)</label>
                <input
                  type="number"
                  name="display_duration_seconds"
                  value={formData.display_duration_seconds}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Задержка до закрытия (сек)</label>
                <input
                  type="number"
                  name="close_delay_seconds"
                  value={formData.close_delay_seconds}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Частота показа</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Максимум показов в день</label>
              <input
                type="number"
                name="max_shows_per_day"
                value={formData.max_shows_per_day}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Стилизация</h2>
            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="600px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет фона</label>
                <input
                  type="color"
                  name="background_color"
                  value={formData.background_color}
                  onChange={handleChange}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет текста</label>
                <input
                  type="color"
                  name="text_color"
                  value={formData.text_color}
                  onChange={handleChange}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет кнопки</label>
                <input
                  type="color"
                  name="button_color"
                  value={formData.button_color}
                  onChange={handleChange}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Активировать рекламу</span>
            </label>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-6 border-t bg-white rounded-lg shadow p-8">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? "Сохранение..." : "Сохранить рекламу"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/advertisements")}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
