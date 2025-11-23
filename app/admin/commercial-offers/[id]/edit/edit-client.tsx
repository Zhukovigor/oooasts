"use client"

import type React from "react"
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

  const [titleFontSize, setTitleFontSize] = useState(28)
  const [equipmentFontSize, setEquipmentFontSize] = useState(13)
  const [priceBlockOffset, setPriceBlockOffset] = useState(0) // смещение в right (пиксели)
  const [photoScale, setPhotoScale] = useState(100) // масштаб фото в процентах

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/commercial-offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...offer,
          titleFontSize,
          equipmentFontSize,
          priceBlockOffset,
          photoScale,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("Коммерческое предложение обновлено")
        router.push("/admin/commercial-offers")
      } else {
        alert(`Ошибка при сохранении: ${data.message || data.error}`)
        console.error("[v0] Save error:", data)
      }
    } catch (error) {
      console.error("[v0] Error saving offer:", error)
      alert("Ошибка при сохранении")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Вы уверены что хотите удалить это коммерческое предложение?")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/commercial-offers/${offer.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        alert("Коммерческое предложение удалено")
        router.push("/admin/commercial-offers")
      } else {
        alert(`Ошибка при удалении: ${data.message || data.error}`)
        console.error("[v0] Delete error:", data)
      }
    } catch (error) {
      console.error("[v0] Error deleting offer:", error)
      alert("Ошибка при удалении")
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

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        setOffer(json)
        alert("JSON успешно импортирован")
      } catch (error) {
        alert("Ошибка при импорте JSON")
      }
    }
    reader.readAsText(file)
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Редактировать КП</h1>
          <Link href="/admin/commercial-offers">
            <Button variant="outline">Назад</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Left: Form */}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Размер шрифта названия: {titleFontSize}px
              </label>
              <input
                type="range"
                min="16"
                max="48"
                value={titleFontSize}
                onChange={(e) => setTitleFontSize(Number(e.target.value))}
                className="w-full"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Размер шрифта категории: {equipmentFontSize}px
              </label>
              <input
                type="range"
                min="10"
                max="24"
                value={equipmentFontSize}
                onChange={(e) => setEquipmentFontSize(Number(e.target.value))}
                className="w-full"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Масштаб фото: {photoScale}%</label>
              <input
                type="range"
                min="50"
                max="150"
                value={photoScale}
                onChange={(e) => setPhotoScale(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Смещение ценового блока вправо: {priceBlockOffset}px
              </label>
              <input
                type="range"
                min="-100"
                max="200"
                value={priceBlockOffset}
                onChange={(e) => setPriceBlockOffset(Number(e.target.value))}
                className="w-full"
              />
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
                  checked={offer.lease && offer.lease !== ""}
                  onChange={(e) => setOffer({ ...offer, lease: e.target.checked ? "Продажа в лизинг" : "" })}
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
              <Button onClick={handleDelete} disabled={isLoading} variant="destructive" className="flex-1">
                Удалить
              </Button>
              <Button onClick={handleExportJSON} variant="outline" className="flex-1 bg-transparent">
                JSON
              </Button>
              <label className="flex-1 cursor-pointer">
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                <div className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-700 text-center">
                  Загрузить JSON
                </div>
              </label>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-8 h-fit max-h-[calc(100vh-100px)] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Предпросмотр</h2>
            <iframe
              srcDoc={generatePreview(offer, { titleFontSize, equipmentFontSize, priceBlockOffset, photoScale })}
              className="w-full h-[600px] border border-gray-200 rounded"
              title="Preview"
            />
            <div className="mt-4 flex gap-2 flex-col">
              <a href={`/api/commercial-offers/${offer.id}/view`} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-green-600 hover:bg-green-700">Открыть в браузере</Button>
              </a>
              <a href={`/api/commercial-offers/${offer.id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">Скачать PDF</Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function generatePreview(offer: any, styling: any): string {
  const specs = offer.specifications || {}
  const specsArray = Object.entries(specs)

  const specsHTML = specsArray
    .map(
      ([key, value]) =>
        `<tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; font-weight: 500; color: #666; width: 40%; font-size: 13px;">${escapeHtml(String(key))}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0; color: #333; width: 60%; font-size: 13px; text-align: right;">${escapeHtml(String(value))}</td>
    </tr>`,
    )
    .join("")

  const formattedPrice = offer.price ? offer.price.toLocaleString("ru-RU") : "Не указана"

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; background: white; }
    .page { padding: 0; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #000; padding-bottom: 15px; }
    .header-small-text { font-size: 11px; letter-spacing: 1px; color: #666; margin-bottom: 5px; }
    .header-category { font-size: ${styling.equipmentFontSize}px; color: #999; margin-bottom: 8px; }
    .header-title { font-size: ${styling.titleFontSize}px; font-weight: bold; color: #000; }
    .content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .image-box { display: flex; align-items: center; justify-content: center; background: #f5f5f5; min-height: 250px; }
    .image-box img { max-width: 100%; max-height: 250px; object-fit: contain; transform: scale(${styling.photoScale / 100}); }
    .price-section { margin-right: ${styling.priceBlockOffset}px; }
    .price-label { font-size: 12px; color: #999; margin-bottom: 10px; }
    .price-value { font-size: 28px; font-weight: bold; margin-bottom: 15px; }
    .conditions-list { list-style: none; font-size: 12px; line-height: 1.8; }
    .conditions-list li:before { content: "• "; color: #999; margin-right: 6px; }
    .specs-title { font-size: 14px; font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; }
    .specs-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .specs-table td { padding: 12px 16px; border-bottom: 1px solid #e0e0e0; }
    .specs-table td:first-child { font-weight: 500; color: #666; width: 40%; }
    .specs-table td:last-child { color: #333; width: 60%; text-align: right; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-small-text">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</div>
      ${offer.equipment ? `<div class="header-category">${escapeHtml(offer.equipment)}</div>` : ""}
      <div class="header-title">${escapeHtml(offer.title || "Без названия")}</div>
    </div>
    <div class="content">
      <div class="image-box">
        ${offer.image_url ? `<img src="${escapeHtml(offer.image_url)}" onerror="this.style.display='none'">` : "<div style='color: #999;'>Нет изображения</div>"}
      </div>
      <div class="price-section">
        <div class="price-label">Стоимость техники:</div>
        <div class="price-value">${formattedPrice} руб.</div>
        ${offer.vat_included ? `<div style="font-size: 12px; color: #666; margin-bottom: 15px;">Стоимость с НДС.</div>` : ""}
        <ul class="conditions-list">
          ${offer.availability ? `<li>${escapeHtml(offer.availability)}</li>` : ""}
          ${offer.lease ? `<li>${escapeHtml(offer.lease)}</li>` : ""}
          ${offer.payment_type ? `<li>${escapeHtml(offer.payment_type)}</li>` : ""}
          ${offer.diagnostics_passed ? `<li>Диагностика пройдена.</li>` : ""}
        </ul>
      </div>
    </div>
    ${
      specsArray.length > 0
        ? `
      <div class="specs-title">Технические характеристики</div>
      <table class="specs-table"><tbody>${specsHTML}</tbody></table>
    `
        : ""
    }
  </div>
</body>
</html>
  `
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
