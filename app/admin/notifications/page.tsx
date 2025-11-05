import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NotificationsEditClient from "./edit-client"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: settings, error } = await supabase.from("notification_settings").select("*").single()

  if (error || !settings) {
    redirect("/admin")
  }

  return <NotificationsEditClient settings={settings} />
}
