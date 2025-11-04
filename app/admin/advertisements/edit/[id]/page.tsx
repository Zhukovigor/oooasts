import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import AdvertisementEditClient from "./edit-client"

export const metadata = {
  title: "Редактировать рекламу | Админ панель",
  description: "Редактирование рекламного объявления",
}

export default async function EditAdvertisementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: advertisement, error } = await supabase.from("advertisements").select("*").eq("id", id).single()

  if (error || !advertisement) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Редактировать рекламу</h1>
        <p className="text-gray-600 mb-8">Обновите параметры рекламного объявления</p>
        <AdvertisementEditClient advertisement={advertisement} />
      </div>
    </div>
  )
}
