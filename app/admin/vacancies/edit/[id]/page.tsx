import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import VacancyEditClient from "./edit-client"

export default async function EditVacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: vacancy, error } = await supabase.from("vacancies").select("*").eq("id", id).single()

  if (error || !vacancy) {
    notFound()
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Редактировать вакансию</h1>
      <p className="text-muted-foreground mb-8">Обновите информацию о вакансии</p>
      <VacancyEditClient vacancy={vacancy} />
    </div>
  )
}
