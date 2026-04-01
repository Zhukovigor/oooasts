import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import HeroSlideEditClient from "./edit-client"

export const metadata = {
  title: "Редактировать слайд | Админ панель",
  description: "Редактирование слайда баннера",
}

export default async function EditHeroSlidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: slide, error } = await supabase.from("hero_slides").select("*").eq("id", id).single()

  if (error || !slide) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Редактировать слайд</h1>
        <HeroSlideEditClient slide={slide} />
      </div>
    </div>
  )
}
