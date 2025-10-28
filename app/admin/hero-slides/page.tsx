import { Suspense } from "react"
import { createAdminClient } from "@/lib/supabase/admin"
import HeroSlidesListClient from "./list-client"

export const metadata = {
  title: "Управление баннером | Админ панель",
  description: "Управление слайдами главного баннера",
}

export default async function HeroSlidesPage() {
  const supabase = createAdminClient()

  const { data: slides, error } = await supabase
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching hero slides:", error)
  }

  return (
    <div className="p-8">
      <Suspense fallback={<div>Загрузка...</div>}>
        <HeroSlidesListClient initialSlides={slides || []} />
      </Suspense>
    </div>
  )
}
