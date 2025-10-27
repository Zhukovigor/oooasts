"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"

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
