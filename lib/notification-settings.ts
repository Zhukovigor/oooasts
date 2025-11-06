import { createAdminClient } from "@/lib/supabase/admin"

export async function getNotificationSettings() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("notification_settings").select("*").single()

    if (error) {
      console.error("[v0] Error fetching notification settings:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("[v0] Error in getNotificationSettings:", error)
    return null
  }
}
