import { createAdminClient } from "@/lib/supabase/admin"
import VacanciesListClient from "./list-client"

export default async function AdminVacanciesPage() {
  const supabase = createAdminClient()
  const { data: vacancies } = await supabase.from("vacancies").select("*").order("sort_order", { ascending: true })

  return <VacanciesListClient vacancies={vacancies || []} />
}
