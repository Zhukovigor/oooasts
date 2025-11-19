"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function EditOfferClient({ initialOffer }: { initialOffer: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [offer, setOffer] = useState(initialOffer)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/commercial-offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offer),
      })

      if (response.ok) {
        alert("Коммерческое предложение обновлено")
        router.push("/admin/commercial-offers")
      } else {
        alert("Ошибка при сохранении")
      }
    } catch (error) {
      console.error("[v0] Error saving offer:", error)
      alert("Ошибка при сохранении")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Редактировать КП</h1>
          <Link href="/admin/commercial-offers">
            <Button variant="outline">Назад</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
            <Input
              value={offer.title || ""}
              onChange={(e) => setOffer({ ...offer, title: e.target.value })}
              placeholder="Название техники"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
            <Textarea
              value={offer.description || ""}
              onChange={(e) => setOffer({ ...offer, description: e.target.value })}
              placeholder="Описание"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Цена (руб.)</label>
              <Input
                type="number"
                value={offer.price || 0}
                onChange={(e) => setOffer({ ...offer, price: parseInt(e.target.value) })}
                placeholder="Цена"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Цена с НДС (руб.)</label>
              <Input
                type="number"
                value={offer.price_with_vat || 0}
                onChange={(e) => setOffer({ ...offer, price_with_vat: parseInt(e.target.value) })}
                placeholder="Цена с НДС"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL фото</label>
            <Input
              value={offer.image_url || ""}
              onChange={(e) => setOffer({ ...offer, image_url: e.target.value })}
              placeholder="URL фото"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
            <Link href="/admin/commercial-offers">
              <Button variant="outline">Отмена</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
