import { createServerClient } from "@/lib/supabase-server"
import CampaignCreatorClient from "./campaign-creator-client"

export const dynamic = "force-dynamic"

export default async function NewCampaignPage() {
  const supabase = await createServerClient()

  const [templatesResult, contactListsResult, smtpResult] = await Promise.all([
    // Добавляем поле attachments в запрос
    supabase
      .from("email_templates")
      .select("*, attachments")
      .eq("is_active", true)
      .order("name"),
    supabase.from("contact_lists").select("id, name").order("created_at", { ascending: false }),
    supabase.from("smtp_accounts").select("*").eq("is_active", true).order("name"),
  ])

  // Проверяем данные шаблонов
  console.log("Templates loaded:", templatesResult.data?.length)
  templatesResult.data?.forEach((template) => {
    console.log(`Template "${template.name}":`, {
      hasAttachments: !!template.attachments,
      attachmentsCount: template.attachments?.length || 0,
      attachments: template.attachments,
    })
  })

  // Подсчитываем контакты для каждой базы
  const contactListsWithCounts = await Promise.all(
    (contactListsResult.data || []).map(async (list) => {
      const { count } = await supabase
        .from("contact_list_contacts")
        .select("*", { count: "exact", head: true })
        .eq("list_id", list.id)

      return {
        ...list,
        contacts_count: count || 0,
      }
    }),
  )

  return (
    <CampaignCreatorClient
      templates={templatesResult.data || []}
      contactLists={contactListsWithCounts}
      smtpAccounts={smtpResult.data || []}
    />
  )
}
