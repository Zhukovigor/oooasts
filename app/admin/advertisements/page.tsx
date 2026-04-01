"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import ListClient from "./list-client"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function AdvertisementsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление рекламой</h1>
          <p className="text-gray-600 mt-2">Создавайте, редактируйте и управляйте рекламными кампаниями</p>
        </div>
        <Link href="/admin/advertisements/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Добавить рекламу
          </Button>
        </Link>
      </div>

      <ListClient />
    </div>
  )
}
