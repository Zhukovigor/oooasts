"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

  const handleExportJSON = () => {
    const json = JSON.stringify(offer, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${offer.title || "offer"}_${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSpecChange = (key: string, newKey: string, value: string) => {
    const newSpecs = { ...offer.specifications }
    if (key !== newKey) {
      delete newSpecs[key]
    }
    newSpecs[newKey] = value
    setOffer({ ...offer, specifications: newSpecs })
  }

  const handleDeleteSpec = (key: string) => {
    const newSpecs = { ...offer.specifications }
    delete newSpecs[key]
    setOffer({ ...offer, specifications: newSpecs })
  }

  const handleAddSpec = () => {
    const newKey = `Характеристика ${Object.keys(offer.specifications || {}).length + 1}`
    setOffer({
      ...offer,
      specifications: {
        ...(offer.specifications || {}),
        [newKey]: "",
      },
    })
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Категория (оборудование)</label>
            <Input
              value={offer.equipment || ""}
              onChange={(e) => setOffer({ ...offer, equipment: e.target.value })}
              placeholder="Например: СЕДЕЛЬНЫЙ ТЯГАЧ"
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
                onChange={(e) => setOffer({ ...offer, price: Number.parseInt(e.target.value) || 0 })}
                placeholder="Цена"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Цена с НДС (руб.)</label>
              <Input
                type="number"
                value={offer.price_with_vat || 0}
                onChange={(e) => setOffer({ ...offer, price_with_vat: Number.parseInt(e.target.value) || 0 })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Наличие</label>
              <Input
                value={offer.availability || ""}
                onChange={(e) => setOffer({ ...offer, availability: e.target.value })}
                placeholder="В наличии"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Способ оплаты</label>
              <Input
                value={offer.payment_type || ""}
                onChange={(e) => setOffer({ ...offer, payment_type: e.target.value })}
                placeholder="Безналичная оплата с НДС"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={offer.vat_included || false}
                onChange={(e) => setOffer({ ...offer, vat_included: e.target.checked })}
                className="mr-2 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Стоимость с НДС</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={offer.lease || false}
                onChange={(e) => setOffer({ ...offer, lease: e.target.checked })}
                className="mr-2 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Продажа в лизинг</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={offer.diagnostics_passed || false}
                onChange={(e) => setOffer({ ...offer, diagnostics_passed: e.target.checked })}
                className="mr-2 w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Диагностика пройдена</span>
            </label>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Технические характеристики</h2>
              <Button onClick={handleAddSpec} variant="outline" size="sm">
                + Добавить
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(offer.specifications || {}).map(([key, value]: any) => (
                <div key={key} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Параметр</label>
                    <Input
                      value={key}
                      onChange={(e) => handleSpecChange(key, e.target.value, value)}
                      placeholder="Название"
                      size="sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Значение</label>
                    <Input
                      value={value}
                      onChange={(e) => handleSpecChange(key, key, e.target.value)}
                      placeholder="Значение"
                      size="sm"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteSpec(key)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-6 border-t">
            <Button onClick={handleSave} disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
            <Button onClick={handleExportJSON} variant="outline" className="flex-1 bg-transparent">
              Экспортировать JSON
            </Button>
            <Link href="/admin/commercial-offers" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Отмена
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
