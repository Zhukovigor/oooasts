"use client"

import type React from "react"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TextOverlayEditor from "@/components/advertisement/text-overlay-editor"
import CollageEditor from "@/components/advertisement/collage-editor"

export default function AdvertisementFormClient() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    button_text: "Подробнее",
    button_url: "",
    start_date: "",
    end_date: "",
    display_duration_seconds: 10,
    close_delay_seconds: 5,
    max_shows_per_day: 3,
    position: "center",
    width: "800px",
    height: "400px",
    background_color: "#ffffff",
    background_opacity: 0.8,
    text_color: "#000000",
    button_color: "#ff0000",
    is_active: true,
    text_overlay: null,
    collage_config: null,
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" || type === "range" ? Number(value) : value,
    }))
  }

  const handleTextOverlayChange = (textOverlay: any) => {
    console.log("[v0] Text overlay changed:", textOverlay)
    setFormData((prev) => ({
      ...prev,
      text_overlay: textOverlay,
    }))
  }

  const handleCollageChange = (collageConfig: any) => {
    console.log("[v0] Collage config changed:", collageConfig)
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
      console.log("[v0] Form data before submit:", formData)

      const dataToInsert = {
        ...formData,
        text_overlay:
          formData.text_overlay && Object.keys(formData.text_overlay).length > 0
            ? JSON.stringify(formData.text_overlay)
            : null,
        collage_config:
          formData.collage_config && Object.keys(formData.collage_config).length > 0
            ? JSON.stringify(formData.collage_config)
            : null,
      }

      console.log("[v0] Data to insert:", dataToInsert)

      const { error, data } = await supabase.from("advertisements").insert([dataToInsert]).select()

      if (error) {
        console.error("[v0] Supabase error:", error)
        throw error
      }

      console.log("[v0] Advertisement created:", data)
      alert("Реклама успешно создана")
      router.push("/admin/advertisements")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Error creating ad:", error.message || error)
      alert(`Ошибка при создании рекламы: ${error.message || "Неизвестная ошибка"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="text">Текст на фото</TabsTrigger>
          <TabsTrigger value="collage">Коллаж</TabsTrigger>
          <TabsTrigger value="settings">Параметры</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="bg-white rounded-lg shadow p-8 space-y-8">
          {/* Basic Information Tab */}
          <div className="space-y-6">
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
          {/* Settings Tab */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Настройки времени</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Начало показа</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Конец показа</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
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
                    placeholder="800px"
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
                    placeholder="400px"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Прозрачность фона: {Math.round(formData.background_opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    name="background_opacity"
                    value={formData.background_opacity}
                    onChange={handleChange}
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full"
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
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 p-8 border-t bg-gray-50">
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? "Создание..." : "Создать рекламу"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/advertisements")}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
