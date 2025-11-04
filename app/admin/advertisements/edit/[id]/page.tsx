import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import AdvertisementEditClient from "./edit-client"

export const metadata = {
  title: "Редактировать рекламу | Админ панель",
  description: "Редактирование рекламного объявления",
}

export default async function EditAdvertisementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const { id } = resolvedParams

  if (!id) {
    console.error("[v0] No ID provided to edit page")
    return notFound()
  }

  try {
    const supabase = createAdminClient()

    const { data: advertisement, error } = await supabase.from("advertisements").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] Database error:", error)
      return notFound()
    }

    if (!advertisement) {
      console.error("[v0] Advertisement not found for ID:", id)
      return notFound()
    }

    const parsedAdvertisement = {
      ...advertisement,
      text_overlay:
        typeof advertisement.text_overlay === "string"
          ? JSON.parse(advertisement.text_overlay)
          : advertisement.text_overlay,
      collage_config:
        typeof advertisement.collage_config === "string"
          ? JSON.parse(advertisement.collage_config)
          : advertisement.collage_config,
    }

    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Редактировать рекламу</h1>
          <p className="text-gray-600 mb-8">Обновите параметры рекламного объявления</p>
          <AdvertisementEditClient advertisement={parsedAdvertisement} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("[v0] Error in edit page:", error)
    return notFound()
  }
}
