"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"

interface Vacancy {
  id: string
  title: string
  location: string
  employment_type: string
  salary_type: string
  is_active: boolean
  sort_order: number
  created_at: string
}

interface VacanciesListClientProps {
  vacancies: Vacancy[]
}

export default function VacanciesListClient({ vacancies: initialVacancies }: VacanciesListClientProps) {
  const [vacancies, setVacancies] = useState(initialVacancies)
  const [deleting, setDeleting] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту вакансию?")) return

    setDeleting(id)
    const { error } = await supabase.from("vacancies").delete().eq("id", id)

    if (error) {
      alert("Ошибка при удалении вакансии")
      setDeleting(null)
      return
    }

    setVacancies(vacancies.filter((v) => v.id !== id))
    setDeleting(null)
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("vacancies").update({ is_active: !currentStatus }).eq("id", id)

    if (error) {
      alert("Ошибка при изменении статуса")
      return
    }

    setVacancies(vacancies.map((v) => (v.id === id ? { ...v, is_active: !currentStatus } : v)))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление вакансиями</h1>
          <p className="text-gray-600 mt-2">Всего вакансий: {vacancies.length}</p>
        </div>
        <Link href="/admin/vacancies/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Добавить вакансию
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {vacancies.map((vacancy) => (
          <Card key={vacancy.id} className={!vacancy.is_active ? "opacity-60" : ""}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{vacancy.title}</h3>
                    {!vacancy.is_active && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">Неактивна</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>{vacancy.location}</span>
                    <span>•</span>
                    <span>{vacancy.employment_type}</span>
                    <span>•</span>
                    <span>{vacancy.salary_type}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Создана: {new Date(vacancy.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(vacancy.id, vacancy.is_active)}
                    title={vacancy.is_active ? "Деактивировать" : "Активировать"}
                  >
                    {vacancy.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Link href={`/admin/vacancies/edit/${vacancy.id}`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(vacancy.id)}
                    disabled={deleting === vacancy.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {vacancies.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-600 mb-4">Вакансий пока нет</p>
              <Link href="/admin/vacancies/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Создать первую вакансию
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
