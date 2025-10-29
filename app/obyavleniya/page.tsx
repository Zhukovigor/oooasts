import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase-server"
import AnnouncementsClient from "./client"

export const metadata: Metadata = {
  title: "Текстовые объявления - Спрос и предложение спецтехники | ООО АСТС",
  description:
    "Бесплатная доска объявлений по спецтехнике. Разместите объявление о покупке или продаже строительной техники, оборудования и запчастей.",
  keywords: "объявления спецтехника, купить спецтехнику, продать спецтехнику, доска объявлений, спрос предложение",
}

export const revalidate = 60 // Revalidate every 60 seconds

export default async function AnnouncementsPage() {
  const supabase = await createServerClient()

  // Fetch announcements from database
  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .eq("is_moderated", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching announcements:", error)
  }

  return <AnnouncementsClient initialAnnouncements={announcements || []} />
}
