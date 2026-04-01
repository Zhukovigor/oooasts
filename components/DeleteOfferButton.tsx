"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"

export default function DeleteOfferButton({ offerId }: { offerId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Вы уверены? Это действие нельзя отменить.")) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/commercial-offers/${offerId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Коммерческое предложение удалено")
        router.refresh()
      } else {
        alert("Ошибка при удалении")
      }
    } catch (error) {
      console.error("[v0] Error deleting offer:", error)
      alert("Ошибка при удалении")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDelete}
      disabled={isLoading}
      className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
    >
      {isLoading ? "Удаление..." : "Удалить"}
    </Button>
  )
}
