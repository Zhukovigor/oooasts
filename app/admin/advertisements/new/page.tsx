"use client"

import FormClient from "./form-client"

export default function NewAdvertisementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Создать рекламу</h1>
        <p className="text-gray-600 mt-2">Добавьте новую рекламную кампанию</p>
      </div>
      <FormClient />
    </div>
  )
}
