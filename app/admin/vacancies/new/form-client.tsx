"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { Plus, X } from "lucide-react"

export default function VacancyFormClient() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requirements, setRequirements] = useState<string[]>([""])
  const [responsibilities, setResponsibilities] = useState<string[]>([""])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const addRequirement = () => setRequirements([...requirements, ""])
  const removeRequirement = (index: number) => setRequirements(requirements.filter((_, i) => i !== index))
  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements]
    updated[index] = value
    setRequirements(updated)
  }

  const addResponsibility = () => setResponsibilities([...responsibilities, ""])
  const removeResponsibility = (index: number) => setResponsibilities(responsibilities.filter((_, i) => i !== index))
  const updateResponsibility = (index: number, value: string) => {
    const updated = [...responsibilities]
    updated[index] = value
    setResponsibilities(updated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    const conditions = {
      salary: formData.get("condition_salary") as string,
      format: formData.get("condition_format") as string,
      schedule: formData.get("condition_schedule") as string,
      training: formData.get("condition_training") as string,
    }

    const { error } = await supabase.from("vacancies").insert({
      title: formData.get("title") as string,
      location: formData.get("location") as string,
      employment_type: formData.get("employment_type") as string,
      salary_type: formData.get("salary_type") as string,
      description: formData.get("description") as string,
      requirements: requirements.filter((r) => r.trim() !== ""),
      responsibilities: responsibilities.filter((r) => r.trim() !== ""),
      conditions,
      is_active: formData.get("is_active") === "on",
      sort_order: Number.parseInt(formData.get("sort_order") as string) || 0,
    })

    setIsSubmitting(false)

    if (error) {
      alert("Ошибка при создании вакансии: " + error.message)
      return
    }

    router.push("/admin/vacancies")
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название вакансии *</label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Менеджер по продажам спецтехники"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Локация *</label>
                <input
                  type="text"
                  name="location"
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Россия (удаленно)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Тип занятости *</label>
                <select name="employment_type" required className="w-full px-3 py-2 border rounded-lg">
                  <option value="Полная занятость">Полная занятость</option>
                  <option value="Частичная занятость">Частичная занятость</option>
                  <option value="Проектная работа">Проектная работа</option>
                  <option value="Стажировка">Стажировка</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Тип оплаты *</label>
              <input
                type="text"
                name="salary_type"
                required
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="% от продаж"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Описание *</label>
              <textarea
                name="description"
                required
                rows={4}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Краткое описание вакансии..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Требования</label>
              {requirements.map((req, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="Требование к кандидату"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeRequirement(index)}
                    disabled={requirements.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addRequirement} className="mt-2 bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Добавить требование
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Обязанности</label>
              {responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="Обязанность сотрудника"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeResponsibility(index)}
                    disabled={responsibilities.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addResponsibility} className="mt-2 bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Добавить обязанность
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Условия работы</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Зарплата</label>
                  <input
                    type="text"
                    name="condition_salary"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Высокий доход"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Формат работы</label>
                  <input
                    type="text"
                    name="condition_format"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Удаленная работа"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">График</label>
                  <input
                    type="text"
                    name="condition_schedule"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Гибкий график"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Обучение</label>
                  <input
                    type="text"
                    name="condition_training"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Полное обучение"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_active" defaultChecked className="rounded" />
                <span className="text-sm">Активная вакансия</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Порядок сортировки:</label>
                <input type="number" name="sort_order" defaultValue={0} className="w-20 px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </div>
          {/* </CHANGE> */}

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? "Создание..." : "Создать вакансию"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
