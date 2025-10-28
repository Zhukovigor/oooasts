"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@supabase/ssr"

export default function HeroSlideFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    image_alt: "",
    button_text: "Связаться с нами",
    button_link: "#join",
    button_visible: true,
    button_color: "#2563eb",
    button_text_color: "#ffffff",
    title_font_size: "5xl",
    title_font_weight: "black",
    title_color: "#ffffff",
    title_alignment: "left",
    subtitle_font_size: "xl",
    subtitle_font_weight: "extrabold",
    subtitle_color: "#e5e7eb",
    content_position: "center",
    content_alignment: "left",
    overlay_opacity: 0.5,
    overlay_color: "#000000",
    sort_order: 0,
    is_active: true,
    auto_rotate_seconds: 15,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from("hero_slides").insert([formData])

    if (error) {
      alert("Ошибка при создании слайда: " + error.message)
      setLoading(false)
    } else {
      router.push("/admin/hero-slides")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Основная информация</h2>

          <div>
            <Label htmlFor="title">Заголовок *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="subtitle">Подзаголовок</Label>
            <Textarea
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="image_url">URL изображения *</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="/images/banner.jpg"
              required
            />
          </div>

          <div>
            <Label htmlFor="image_alt">Alt текст изображения</Label>
            <Input
              id="image_alt"
              value={formData.image_alt}
              onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
            />
          </div>
        </div>

        {/* Button Settings */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Настройки кнопки</h2>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="button_visible"
              checked={formData.button_visible}
              onChange={(e) => setFormData({ ...formData, button_visible: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="button_visible">Показывать кнопку</Label>
          </div>

          {formData.button_visible && (
            <>
              <div>
                <Label htmlFor="button_text">Текст кнопки</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="button_link">Ссылка кнопки</Label>
                <Input
                  id="button_link"
                  value={formData.button_link}
                  onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button_color">Цвет кнопки</Label>
                  <Input
                    id="button_color"
                    type="color"
                    value={formData.button_color}
                    onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="button_text_color">Цвет текста кнопки</Label>
                  <Input
                    id="button_text_color"
                    type="color"
                    value={formData.button_text_color}
                    onChange={(e) => setFormData({ ...formData, button_text_color: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Title Styling */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Стиль заголовка</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title_font_size">Размер шрифта</Label>
              <select
                id="title_font_size"
                value={formData.title_font_size}
                onChange={(e) => setFormData({ ...formData, title_font_size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="3xl">3XL</option>
                <option value="4xl">4XL</option>
                <option value="5xl">5XL</option>
                <option value="6xl">6XL</option>
                <option value="7xl">7XL</option>
                <option value="8xl">8XL</option>
              </select>
            </div>

            <div>
              <Label htmlFor="title_font_weight">Толщина шрифта</Label>
              <select
                id="title_font_weight"
                value={formData.title_font_weight}
                onChange={(e) => setFormData({ ...formData, title_font_weight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="semibold">Semibold</option>
                <option value="bold">Bold</option>
                <option value="extrabold">Extrabold</option>
                <option value="black">Black</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title_color">Цвет заголовка</Label>
              <Input
                id="title_color"
                type="color"
                value={formData.title_color}
                onChange={(e) => setFormData({ ...formData, title_color: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="title_alignment">Выравнивание</Label>
              <select
                id="title_alignment"
                value={formData.title_alignment}
                onChange={(e) => setFormData({ ...formData, title_alignment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="left">Слева</option>
                <option value="center">По центру</option>
                <option value="right">Справа</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subtitle Styling */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Стиль подзаголовка</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subtitle_font_size">Размер шрифта</Label>
              <select
                id="subtitle_font_size"
                value={formData.subtitle_font_size}
                onChange={(e) => setFormData({ ...formData, subtitle_font_size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="sm">SM</option>
                <option value="base">Base</option>
                <option value="lg">LG</option>
                <option value="xl">XL</option>
                <option value="2xl">2XL</option>
              </select>
            </div>

            <div>
              <Label htmlFor="subtitle_font_weight">Толщина шрифта</Label>
              <select
                id="subtitle_font_weight"
                value={formData.subtitle_font_weight}
                onChange={(e) => setFormData({ ...formData, subtitle_font_weight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="semibold">Semibold</option>
                <option value="bold">Bold</option>
                <option value="extrabold">Extrabold</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="subtitle_color">Цвет подзаголовка</Label>
            <Input
              id="subtitle_color"
              type="color"
              value={formData.subtitle_color}
              onChange={(e) => setFormData({ ...formData, subtitle_color: e.target.value })}
            />
          </div>
        </div>

        {/* Content Position */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Позиционирование контента</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="content_position">Позиция</Label>
              <select
                id="content_position"
                value={formData.content_position}
                onChange={(e) => setFormData({ ...formData, content_position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="top">Сверху</option>
                <option value="center">По центру</option>
                <option value="bottom">Снизу</option>
              </select>
            </div>

            <div>
              <Label htmlFor="content_alignment">Выравнивание</Label>
              <select
                id="content_alignment"
                value={formData.content_alignment}
                onChange={(e) => setFormData({ ...formData, content_alignment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="left">Слева</option>
                <option value="center">По центру</option>
                <option value="right">Справа</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overlay Settings */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Настройки наложения</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="overlay_color">Цвет наложения</Label>
              <Input
                id="overlay_color"
                type="color"
                value={formData.overlay_color}
                onChange={(e) => setFormData({ ...formData, overlay_color: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="overlay_opacity">Прозрачность (0-1)</Label>
              <Input
                id="overlay_opacity"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.overlay_opacity}
                onChange={(e) => setFormData({ ...formData, overlay_opacity: Number.parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Slide Settings */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Настройки слайда</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sort_order">Порядок сортировки</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: Number.parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="auto_rotate_seconds">Автоповорот (секунды)</Label>
              <Input
                id="auto_rotate_seconds"
                type="number"
                value={formData.auto_rotate_seconds}
                onChange={(e) => setFormData({ ...formData, auto_rotate_seconds: Number.parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="is_active">Активен</Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Создание..." : "Создать слайд"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>
        </div>
      </Card>
    </form>
  )
}
