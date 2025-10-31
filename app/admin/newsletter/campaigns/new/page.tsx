import { createServerClient } from "@/lib/supabase-server"
import CampaignCreatorClient from "./campaign-creator-client"

export const dynamic = "force-dynamic"

export default async function NewCampaignPage() {
  const supabase = await createServerClient()

  const [templatesResult, subscribersResult, smtpResult] = await Promise.all([
    // Добавляем поле attachments в запрос
    supabase.from("email_templates").select("*, attachments").eq("is_active", true).order("name"),
    supabase.from("newsletter_subscribers").select("*").eq("status", "active"),
    supabase.from("smtp_accounts").select("*").eq("is_active", true).order("name"),
  ])

  // Проверяем данные шаблонов
  console.log("Templates loaded:", templatesResult.data?.length)
  templatesResult.data?.forEach(template => {
    console.log(`Template "${template.name}":`, {
      hasAttachments: !!template.attachments,
      attachmentsCount: template.attachments?.length || 0,
      attachments: template.attachments
    })
  })

  return (
    <CampaignCreatorClient
      templates={templatesResult.data || []}
      subscribers={subscribersResult.data || []}
      smtpAccounts={smtpResult.data || []}
    />
  )
}
