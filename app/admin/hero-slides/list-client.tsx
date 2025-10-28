"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import Image from "next/image"

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  image_alt: string | null
  button_text: string
  button_link: string
  button_visible: boolean
  sort_order: number
  is_active: boolean
  created_at: string
}

export default function HeroSlidesListClient({ initialSlides }: { initialSlides: HeroSlide[] }) {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const toggleActive = async (id: string, currentStatus: boolean) => {
    setLoading(true)
    const { error } = await supabase.from("hero_slides").update({ is_active: !currentStatus }).eq("id", id)

    if (error) {
      alert("Ошибка при изменении статуса: " + error.message)
    } else {
      setSlides(slides.map((slide) => (slide.id === id ? { ...slide, is_active: !currentStatus } : slide)))
    }
    setLoading(false)
  }

  const deleteSlide = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот слайд?")) return

    setLoading(true)
    const { error } = await supabase.from("hero_slides").delete().eq("id", id)

    if (error) {
      alert("Ошибка при удалении: " + error.message)
    } else {
      setSlides(slides.filter((slide) => slide.id !== id))
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление баннером</h1>
          <p className="text-gray-600 mt-1">Управление слайдами главного баннера</p>
        </div>
        <Link href="/admin/hero-slides/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Создать слайд
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {slides.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Нет слайдов. Создайте первый слайд.</p>
          </Card>
        ) : (
          slides.map((slide) => (
            <Card key={slide.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center">
                  <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                </div>

                <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={slide.image_url || "/placeholder.svg"}
                    alt={slide.image_alt || slide.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{slide.title}</h3>
                      {slide.subtitle && <p className="text-gray-600 mt-1">{slide.subtitle}</p>}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Порядок: {slide.sort_order}</span>
                        {slide.button_visible && <span>Кнопка: {slide.button_text}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(slide.id, slide.is_active)}
                        disabled={loading}
                      >
                        {slide.is_active ? (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Активен
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Неактивен
                          </>
                        )}
                      </Button>

                      <Link href={`/admin/hero-slides/edit/${slide.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Редактировать
                        </Button>
                      </Link>

                      <Button variant="outline" size="sm" onClick={() => deleteSlide(slide.id)} disabled={loading}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
