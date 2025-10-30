import { Suspense } from "react"
import { createServerClient } from "@/lib/supabase-server"
import NewsletterClient from "./newsletter-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function NewsletterPage() {
  const supabase = await createServerClient()

  const [{ data: subscribers }, { data: templates }, { data: campaigns }] = await Promise.all([
    supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
    supabase.from("email_templates").select("*").order("created_at", { ascending: false }),
    supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }),
  ])

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <NewsletterClient
        initialSubscribers={subscribers || []}
        initialTemplates={templates || []}
        initialCampaigns={campaigns || []}
      />
    </Suspense>
  )
}
