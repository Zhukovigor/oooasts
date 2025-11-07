import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase-server"
import ContactsClient from "./contacts-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ContactsPage() {
  const supabase = await createServerClient()

  const { data: lists } = await supabase
    .from("contact_lists")
    .select("*, contact_list_contacts(count)")
    .order("created_at", { ascending: false })

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <ContactsClient initialLists={lists || []} />
    </Suspense>
  )
}
