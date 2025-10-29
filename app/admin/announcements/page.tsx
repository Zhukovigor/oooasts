import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase-server"
import AnnouncementsModerationClient from "./moderation-client"

export const metadata: Metadata = {
  title: "Модерация объявлений | Админ панель",
  description: "Управление текстовыми объявлениями",
}

export default async function AnnouncementsModerationPage() {
  const supabase = await createServerClient()

  // Fetch all announcements (including unmoderated)
  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching announcements:", error)
  }

  return <AnnouncementsModerationClient initialAnnouncements={announcements || []} />
}
