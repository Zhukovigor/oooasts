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
