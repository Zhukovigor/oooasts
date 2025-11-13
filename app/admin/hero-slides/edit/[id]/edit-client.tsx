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

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  image_alt: string | null
  button_text: string
  button_link: string
  button_visible: boolean
  button_color: string
  button_text_color: string
  title_font_size: string
  title_font_weight: string
  title_color: string
  title_alignment: string
  subtitle_font_size: string
  subtitle_font_weight: string
  subtitle_color: string
  content_position: string
  content_alignment: string
  overlay_opacity: number
  overlay_color: string
  sort_order: number
  is_active: boolean
  auto_rotate_seconds: number
}

export default function HeroSlideEditClient({ slide }: { slide: HeroSlide }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(slide)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from("hero_slides").update(formData).eq("id", slide.id)

    if (error) {
      alert("Ошибка при обновлении слайда: " + error.message)
      setLoading(false)
    } else {
      router.push("/admin/hero-slides")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-6">
        {/* Same form fields as in form-client.tsx */}

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
              value={formData.subtitle || ""}
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
              required
            />
          </div>

          {/* Additional form fields for styling options */}
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

          <div>
            <Label htmlFor="button_color">Цвет кнопки</Label>
            <Input
              id="button_color"
              value={formData.button_color}
              onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="button_text_color">Цвет текста кнопки</Label>
            <Input
              id="button_text_color"
              value={formData.button_text_color}
              onChange={(e) => setFormData({ ...formData, button_text_color: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="title_font_size">Размер шри��та заголовка</Label>
            <Input
              id="title_font_size"
              value={formData.title_font_size}
              onChange={(e) => setFormData({ ...formData, title_font_size: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="title_font_weight">Толщина шрифта заголовка</Label>
            <Input
              id="title_font_weight"
              value={formData.title_font_weight}
              onChange={(e) => setFormData({ ...formData, title_font_weight: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="title_color">Цвет заголовка</Label>
            <Input
              id="title_color"
              value={formData.title_color}
              onChange={(e) => setFormData({ ...formData, title_color: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="title_alignment">Выравнивание заголовка</Label>
            <Input
              id="title_alignment"
              value={formData.title_alignment}
              onChange={(e) => setFormData({ ...formData, title_alignment: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="subtitle_font_size">Размер шрифта подзаголовка</Label>
            <Input
              id="subtitle_font_size"
              value={formData.subtitle_font_size}
              onChange={(e) => setFormData({ ...formData, subtitle_font_size: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="subtitle_font_weight">Толщина шрифта подзаголовка</Label>
            <Input
              id="subtitle_font_weight"
              value={formData.subtitle_font_weight}
              onChange={(e) => setFormData({ ...formData, subtitle_font_weight: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="subtitle_color">Цвет подзаголовка</Label>
            <Input
              id="subtitle_color"
              value={formData.subtitle_color}
              onChange={(e) => setFormData({ ...formData, subtitle_color: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="content_position">Позиция контента</Label>
            <Input
              id="content_position"
              value={formData.content_position}
              onChange={(e) => setFormData({ ...formData, content_position: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="content_alignment">Выравнивание контента</Label>
            <Input
              id="content_alignment"
              value={formData.content_alignment}
              onChange={(e) => setFormData({ ...formData, content_alignment: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="overlay_opacity">Непрозрачность оверлея</Label>
            <Input
              id="overlay_opacity"
              type="number"
              value={formData.overlay_opacity.toString()}
              onChange={(e) => setFormData({ ...formData, overlay_opacity: Number.parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="overlay_color">Цвет оверлея</Label>
            <Input
              id="overlay_color"
              value={formData.overlay_color}
              onChange={(e) => setFormData({ ...formData, overlay_color: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="sort_order">Порядок сортировки</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order.toString()}
              onChange={(e) => setFormData({ ...formData, sort_order: Number.parseInt(e.target.value) })}
            />
          </div>

          <div>
            <Label htmlFor="is_active">Активен</Label>
            <Input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
          </div>

          <div>
            <Label htmlFor="auto_rotate_seconds">Автоматическое вращение (секунды)</Label>
            <Input
              id="auto_rotate_seconds"
              type="number"
              value={formData.auto_rotate_seconds.toString()}
              onChange={(e) => setFormData({ ...formData, auto_rotate_seconds: Number.parseInt(e.target.value) })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить изменения"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Отмена
          </Button>
        </div>
      </Card>
    </form>
  )
}
