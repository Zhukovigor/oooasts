import type { Metadata } from "next"
import { createServerClient } from "@/lib/supabase-server"
import AnnouncementsModerationClient from "./moderation-client"

export const metadata: Metadata = {
  title: "Модерация объявлений | Админ панель",
  description: "Управление текстовыми объявлениями",
}

export const revalidate = 0

export default async function AnnouncementsModerationPage() {
  const supabase = await createServerClient()

  console.log("[v0] Fetching all announcements for moderation...")

  // Fetch all announcements (including unmoderated)
  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching announcements:", error)
  } else {
    console.log("[v0] Fetched announcements:", announcements?.length || 0)
    console.log("[v0] Pending announcements:", announcements?.filter((a) => !a.is_moderated).length || 0)
  }

  return <AnnouncementsModerationClient initialAnnouncements={announcements || []} />
}
