import { createServerClient } from "@/lib/supabase-server"
import TemplateEditorClient from "./template-editor-client"

export const dynamic = "force-dynamic"

export default async function NewTemplatePage() {
  const supabase = await createServerClient()

  // Fetch SMTP accounts for "from" email selection
  const { data: smtpAccounts } = await supabase.from("smtp_accounts").select("*").eq("is_active", true).order("name")

  return <TemplateEditorClient smtpAccounts={smtpAccounts || []} />
}
