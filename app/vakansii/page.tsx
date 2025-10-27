import type { Metadata } from "next"
import VacanciesClient from "./client"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata: Metadata = {
  title: "Вакансии - Менеджер по продажам спецтехники | ООО АСТС",
  description:
    "Работа в ООО АСТС. Требуются менеджеры по продажам спецтехники. Удаленная работа, оплата % от продаж, возраст 18-35 лет. Обучение, поддержка, карьерный рост. Работа с клиентами по всей России.",
  keywords: [
    "вакансии",
    "работа",
    "менеджер по продажам",
    "спецтехника",
    "удаленная работа",
    "продажи экскаваторов",
    "работа в России",
    "вакансии менеджер",
    "работа удаленно",
    "продажи спецтехники",
  ],
  openGraph: {
    title: "Вакансии - Менеджер по продажам спецтехники | ООО АСТС",
    description: "Работа в ООО АСТС. Требуются менеджеры по продажам спецтехники. Удаленная работа.",
    type: "website",
  },
}

export default async function VacanciesPage() {
  const supabase = createAdminClient()
  const { data: vacancies } = await supabase
    .from("vacancies")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  return <VacanciesClient vacancies={vacancies || []} />
}
