import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import AdvertisementEditClient from "./edit-client"

export default async function EditAdvertisementPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: advertisement } = await supabase
    .from("advertisements")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!advertisement) redirect("/admin/advertisements")

  return <AdvertisementEditClient advertisement={advertisement} />
}
