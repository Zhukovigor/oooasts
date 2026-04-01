import VacancyFormClient from "./form-client"

export default function NewVacancyPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Создать вакансию</h1>
        <p className="text-gray-600 mt-2">Заполните информацию о новой вакансии</p>
      </div>
      <VacancyFormClient />
    </div>
  )
}
