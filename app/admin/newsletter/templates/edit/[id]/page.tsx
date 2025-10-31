import { createServerClient } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import TemplateEditClient from "./edit-client"

export const dynamic = "force-dynamic"

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient()

  const { data: template, error } = await supabase.from("email_templates").select("*").eq("id", params.id).single()

  if (error || !template) {
    notFound()
  }

  const { data: smtpAccounts } = await supabase.from("smtp_accounts").select("id, name, email").eq("is_active", true)

  return <TemplateEditClient template={template} smtpAccounts={smtpAccounts || []} />
}
