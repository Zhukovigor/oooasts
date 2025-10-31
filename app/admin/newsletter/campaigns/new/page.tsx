import { createServerClient } from "@/lib/supabase-server"
import CampaignCreatorClient from "./campaign-creator-client"

export const dynamic = "force-dynamic"

export default async function NewCampaignPage() {
  const supabase = await createServerClient()

  const [templatesResult, subscribersResult, smtpResult] = await Promise.all([
    supabase.from("email_templates").select("*").eq("is_active", true).order("name"),
    supabase.from("newsletter_subscribers").select("*").eq("status", "active"),
    supabase.from("smtp_accounts").select("*").eq("is_active", true).order("name"),
  ])

  return (
    <CampaignCreatorClient
      templates={templatesResult.data || []}
      subscribers={subscribersResult.data || []}
      smtpAccounts={smtpResult.data || []}
    />
  )
}
