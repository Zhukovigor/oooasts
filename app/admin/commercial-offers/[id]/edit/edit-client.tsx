"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Типы
interface CommercialOffer {
  id: string
  title: string
  equipment: string
  description: string
  price: number
  price_with_vat: number
  image_url: string
  availability: string
  payment_type: string
  vat_included: boolean
  lease: boolean
  diagnostics_passed: boolean
  specifications: Record<string, string>
  created_at?: string
  updated_at?: string
}

interface StylingOptions {
  titleFontSize: number
  equipmentFontSize: number
  priceBlockOffset: number
  photoScale: number
}

interface EditOfferClientProps {
  initialOffer: CommercialOffer
}

// Константы
const MESSAGES = {
  saveSuccess: "Коммерческое предложение обновлено",
  deleteConfirm: "Вы уверены что хотите удалить это коммерческое предложение?",
  deleteSuccess: "Коммерческое предложение удалено",
  saveError: "Ошибка при сохранении",
  deleteError: "Ошибка при удалении",
  importSuccess: "JSON успешно импортирован",
  importError: "Ошибка при импорте JSON",
  validationError: "Ошибки валидации",
} as const

const VALIDATION = {
  titleMaxLength: 100,
  equipmentMaxLength: 50,
  descriptionMaxLength: 1000,
  priceMin: 0,
  priceMax: 1000000000,
  specsKeyMaxLength: 50,
  specsValueMaxLength: 100,
} as const

const STYLING_DEFAULTS = {
  titleFontSize: { min: 16, max: 48, default: 28 },
  equipmentFontSize: { min: 10, max: 24, default: 13 },
  priceBlockOffset: { min: -100, max: 200, default: 0 },
  photoScale: { min: 50, max: 150, default: 100 },
} as const

// Хук для debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function EditOfferClient({ initialOffer }: EditOfferClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [offer, setOffer] = useState<CommercialOffer>(initialOffer)

  const [styling, setStyling] = useState<StylingOptions>({
    titleFontSize: STYLING_DEFAULTS.titleFontSize.default,
    equipmentFontSize: STYLING_DEFAULTS.equipmentFontSize.default,
    priceBlockOffset: STYLING_DEFAULTS.priceBlockOffset.default,
    photoScale: STYLING_DEFAULTS.photoScale.default,
  })

  // Debounced значения для предпросмотра
  const debouncedOffer = useDebounce(offer, 300)
  const debouncedStyling = useDebounce(styling, 300)

  // Валидация данных
  const validateOffer = useCallback((offerToValidate: CommercialOffer): string[] => {
    const errors: string[] = []
    
    if (!offerToValidate.title?.trim()) {
      errors.push("Название обязательно")
    }
    
    if (offerToValidate.title.length > VALIDATION.titleMaxLength) {
      errors.push(`Название не должно превышать ${VALIDATION.titleMaxLength} символов`)
    }
    
    if (offerToValidate.equipment.length > VALIDATION.equipmentMaxLength) {
      errors.push(`Категория не должна превышать ${VALIDATION.equipmentMaxLength} символов`)
    }
    
    if (offerToValidate.description.length > VALIDATION.descriptionMaxLength) {
      errors.push(`Описание не должно превышать ${VALIDATION.descriptionMaxLength} символов`)
    }
    
    if (offerToValidate.price < VALIDATION.priceMin) {
      errors.push("Цена не может быть отрицательной")
    }
    
    if (offerToValidate.price > VALIDATION.priceMax) {
      errors.push(`Цена не может превышать ${VALIDATION.priceMax.toLocaleString()} руб.`)
    }
    
    if (offerToValidate.price_with_vat < VALIDATION.priceMin) {
      errors.push("Цена с НДС не может быть отрицательной")
    }

    // Валидация характеристик
    Object.entries(offerToValidate.specifications || {}).forEach(([key, value]) => {
      if (key.length > VALIDATION.specsKeyMaxLength) {
        errors.push(`Название характеристики "${key}" слишком длинное`)
      }
      if (value.length > VALIDATION.specsValueMaxLength) {
        errors.push(`Значение характеристики "${key}" слишком длинное`)
      }
    })
    
    return errors
  }, [])

  const showMessage = useCallback((message: string, isError = false) => {
    if (isError) {
      setError(message)
      setSuccess(null)
    } else {
      setSuccess(message)
      setError(null)
    }
    
    setTimeout(() => {
      setError(null)
      setSuccess(null)
    }, 5000)
  }, [])

  const handleSave = async () => {
    const validationErrors = validateOffer(offer)
    if (validationErrors.length > 0) {
      showMessage(`${MESSAGES.validationError}:\n${validationErrors.join('\n')}`, true)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/commercial-offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...offer,
          ...styling,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showMessage(MESSAGES.saveSuccess)
        router.push("/admin/commercial-offers")
      } else {
        showMessage(`Ошибка при сохранении: ${data.message || data.error}`, true)
        console.error("[v0] Save error:", data)
      }
    } catch (error) {
      console.error("[v0] Error saving offer:", error)
      showMessage(MESSAGES.saveError, true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(MESSAGES.deleteConfirm)) {
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/commercial-offers/${offer.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        showMessage(MESSAGES.deleteSuccess)
        router.push("/admin/commercial-offers")
      } else {
        showMessage(`Ошибка при удалении: ${data.message || data.error}`, true)
        console.error("[v0] Delete error:", data)
      }
    } catch (error) {
      console.error("[v0] Error deleting offer:", error)
      showMessage(MESSAGES.deleteError, true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportJSON = () => {
    try {
      const dataToExport = {
        ...offer,
        ...styling,
        exported_at: new Date().toISOString(),
      }
      
      const json = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${offer.title || "offer"}_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting JSON:", error)
      showMessage("Ошибка при экспорте JSON", true)
    }
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        
        // Валидация импортированных данных
        const validationErrors = validateOffer(json)
        if (validationErrors.length > 0) {
          showMessage(`Ошибка валидации импортированных данных:\n${validationErrors.join('\n')}`, true)
          return
        }

        setOffer(json)
        
        // Восстанавливаем настройки стилей если они есть
        if (json.titleFontSize) setStyling(prev => ({ ...prev, titleFontSize: json.titleFontSize }))
        if (json.equipmentFontSize) setStyling(prev => ({ ...prev, equipmentFontSize: json.equipmentFontSize }))
        if (json.priceBlockOffset) setStyling(prev => ({ ...prev, priceBlockOffset: json.priceBlockOffset }))
        if (json.photoScale) setStyling(prev => ({ ...prev, photoScale: json.photoScale }))
        
        showMessage(MESSAGES.importSuccess)
      } catch (error) {
        console.error("Error importing JSON:", error)
        showMessage(MESSAGES.importError, true)
      }
    }
    reader.readAsText(file)
    
    // Сброс input для возможности повторной загрузки того же файла
    e.target.value = ""
  }

  const handleSpecChange = useCallback((key: string, newKey: string, value: string) => {
    const newSpecs = { ...offer.specifications }
    
    if (key !== newKey) {
      delete newSpecs[key]
    }
    
    newSpecs[newKey] = value
    setOffer(prev => ({ ...prev, specifications: newSpecs }))
  }, [offer.specifications])

  const handleDeleteSpec = useCallback((key: string) => {
    const newSpecs = { ...offer.specifications }
    delete newSpecs[key]
    setOffer(prev => ({ ...prev, specifications: newSpecs }))
  }, [offer.specifications])

  const handleAddSpec = useCallback(() => {
    const baseKey = "Новая характеристика"
    let newKey = baseKey
    let counter = 1
    
    while (offer.specifications?.[newKey]) {
      newKey = `${baseKey} ${counter}`
      counter++
    }
    
    setOffer(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [newKey]: "",
      }
    }))
  }, [offer.specifications])

  const handleStylingChange = useCallback((key: keyof StylingOptions, value: number) => {
    setStyling(prev => ({ ...prev, [key]: value }))
  }, [])

  // Генерация предпросмотра с useMemo для оптимизации
  const previewHtml = useMemo(() => 
    generatePreview(debouncedOffer, debouncedStyling),
    [debouncedOffer, debouncedStyling]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Редактировать КП</h1>
          <Link href="/admin/commercial-offers">
            <Button variant="outline">Назад</Button>
          </Link>
        </div>

        {/* Уведомления */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая колонка: Форма */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Основная информация */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название {offer.title.length}/{VALIDATION.titleMaxLength}
              </label>
              <Input
                value={offer.title}
                onChange={(e) => setOffer(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Название техники"
                maxLength={VALIDATION.titleMaxLength}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Размер шрифта названия: {styling.titleFontSize}px
              </label>
              <input
                type="range"
                min={STYLING_DEFAULTS.titleFontSize.min}
                max={STYLING_DEFAULTS.titleFontSize.max}
                value={styling.titleFontSize}
                onChange={(e) => handleStylingChange('titleFontSize', Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Категория (оборудование) {offer.equipment.length}/{VALIDATION.equipmentMaxLength}
              </label>
              <Input
                value={offer.equipment}
                onChange={(e) => setOffer(prev => ({ ...prev, equipment: e.target.value }))}
                placeholder="Например: СЕДЕЛЬНЫЙ ТЯГАЧ"
                maxLength={VALIDATION.equipmentMaxLength}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Размер шрифта категории: {styling.equipmentFontSize}px
              </label>
              <input
                type="range"
                min={STYLING_DEFAULTS.equipmentFontSize.min}
                max={STYLING_DEFAULTS.equipmentFontSize.max}
                value={styling.equipmentFontSize}
                onChange={(e) => handleStylingChange('equipmentFontSize', Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание {offer.description.length}/{VALIDATION.descriptionMaxLength}
              </label>
              <Textarea
                value={offer.description}
                onChange={(e) => setOffer(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Описание"
                rows={4}
                maxLength={VALIDATION.descriptionMaxLength}
              />
            </div>

            {/* Цены */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цена (руб.)</label>
                <Input
                  type="number"
                  value={offer.price || 0}
                  onChange={(e) => setOffer(prev => ({ ...prev, price: Number.parseInt(e.target.value) || 0 }))}
                  placeholder="Цена"
                  min={VALIDATION.priceMin}
                  max={VALIDATION.priceMax}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цена с НДС (руб.)</label>
                <Input
                  type="number"
                  value={offer.price_with_vat || 0}
                  onChange={(e) => setOffer(prev => ({ ...prev, price_with_vat: Number.parseInt(e.target.value) || 0 }))}
                  placeholder="Цена с НДС"
                  min={VALIDATION.priceMin}
                  max={VALIDATION.priceMax}
                />
              </div>
            </div>

            {/* Изображение */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL фото</label>
              <Input
                value={offer.image_url}
                onChange={(e) => setOffer(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="URL фото"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Масштаб фото: {styling.photoScale}%
              </label>
              <input
                type="range"
                min={STYLING_DEFAULTS.photoScale.min}
                max={STYLING_DEFAULTS.photoScale.max}
                value={styling.photoScale}
                onChange={(e) => handleStylingChange('photoScale', Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Смещение ценового блока вправо: {styling.priceBlockOffset}px
              </label>
              <input
                type="range"
                min={STYLING_DEFAULTS.priceBlockOffset.min}
                max={STYLING_DEFAULTS.priceBlockOffset.max}
                value={styling.priceBlockOffset}
                onChange={(e) => handleStylingChange('priceBlockOffset', Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Условия */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Наличие</label>
                <Input
                  value={offer.availability}
                  onChange={(e) => setOffer(prev => ({ ...prev, availability: e.target.value }))}
                  placeholder="В наличии"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Способ оплаты</label>
                <Input
                  value={offer.payment_type}
                  onChange={(e) => setOffer(prev => ({ ...prev, payment_type: e.target.value }))}
                  placeholder="Безналичная оплата с НДС"
                />
              </div>
            </div>

            {/* Чекбоксы */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={offer.vat_included || false}
                  onChange={(e) => setOffer(prev => ({ ...prev, vat_included: e.target.checked }))}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Стоимость с НДС</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={offer.lease || false}
                  onChange={(e) => setOffer(prev => ({ ...prev, lease: e.target.checked }))}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Продажа в лизинг</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={offer.diagnostics_passed || false}
                  onChange={(e) => setOffer(prev => ({ ...prev, diagnostics_passed: e.target.checked }))}
                  className="mr-2 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Диагностика пройдена</span>
              </label>
            </div>

            {/* Технические характеристики */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Технические характеристики</h2>
                <Button onClick={handleAddSpec} variant="outline" size="sm">
                  + Добавить
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(offer.specifications || {}).map(([key, value]: [string, string]) => (
                  <div key={key} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Параметр {key.length}/{VALIDATION.specsKeyMaxLength}
                      </label>
                      <Input
                        value={key}
                        onChange={(e) => handleSpecChange(key, e.target.value, value)}
                        placeholder="Название"
                        maxLength={VALIDATION.specsKeyMaxLength}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Значение {value.length}/{VALIDATION.specsValueMaxLength}
                      </label>
                      <Input
                        value={value}
                        onChange={(e) => handleSpecChange(key, key, e.target.value)}
                        placeholder="Значение"
                        maxLength={VALIDATION.specsValueMaxLength}
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteSpec(key)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium transition-colors"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {Object.keys(offer.specifications || {}).length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    Нет характеристик. Нажмите "Добавить" чтобы создать первую.
                  </div>
                )}
              </div>
            </div>

            {/* Действия */}
            <div className="flex flex-col sm:flex-row gap-2 pt-6 border-t">
              <Button 
                onClick={handleSave} 
                disabled={isLoading} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? "Сохранение..." : "Сохранить"}
              </Button>
              <Button 
                onClick={handleDelete} 
                disabled={isLoading} 
                variant="destructive" 
                className="flex-1"
              >
                Удалить
              </Button>
              <Button 
                onClick={handleExportJSON} 
                variant="outline" 
                className="flex-1"
              >
                Экспорт JSON
              </Button>
              <label className="flex-1 cursor-pointer">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportJSON} 
                  className="hidden" 
                />
                <div className="w-full px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium text-gray-700 text-center transition-colors">
                  Импорт JSON
                </div>
              </label>
            </div>
          </div>

          {/* Правая колонка: Предпросмотр */}
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-8 h-fit max-h-[calc(100vh-100px)] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Предпросмотр</h2>
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[600px] border border-gray-200 rounded"
              title="Preview"
            />
            <div className="mt-4 flex gap-2 flex-col">
              <a 
                href={`/api/commercial-offers/${offer.id}/view`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Открыть в браузере
                </Button>
              </a>
              <a 
                href={`/api/commercial-offers/${offer.id}/pdf`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Скачать PDF
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Вспомогательные функции
function generatePreview(offer: CommercialOffer, styling: StylingOptions): string {
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
  const formattedPriceWithVat = offer.price_with_vat ? offer.price_with_vat.toLocaleString("ru-RU") : ""

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src https: data:;">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; background: white; }
    .page { padding: 0; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #000; padding-bottom: 15px; }
    .header-small-text { font-size: 11px; letter-spacing: 1px; color: #666; margin-bottom: 5px; }
    .header-category { font-size: ${styling.equipmentFontSize}px; color: #999; margin-bottom: 8px; }
    .header-title { font-size: ${styling.titleFontSize}px; font-weight: bold; color: #000; }
    .content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .image-box { display: flex; align-items: center; justify-content: center; background: #f5f5f5; min-height: 250px; position: relative; }
    .image-box img { max-width: 100%; max-height: 250px; object-fit: contain; transform: scale(${styling.photoScale / 100}); transition: opacity 0.3s; }
    .image-loading { color: #999; }
    .image-error { color: #999; display: none; }
    .price-section { margin-right: ${styling.priceBlockOffset}px; }
    .price-label { font-size: 12px; color: #999; margin-bottom: 10px; }
    .price-value { font-size: 28px; font-weight: bold; margin-bottom: 15px; }
    .price-vat { font-size: 12px; color: #666; margin-bottom: 15px; }
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
        ${offer.image_url ? `
          <img 
            src="${escapeHtml(offer.image_url)}" 
            onload="this.style.opacity='1'" 
            onerror="this.style.display='none'; document.getElementById('image-error').style.display='block'"
            style="opacity: 0;"
            alt="${escapeHtml(offer.title || 'Изображение техники')}"
          >
          <div id="image-error" class="image-error">Ошибка загрузки изображения</div>
        ` : "<div class='image-loading'>Нет изображения</div>"}
      </div>
      <div class="price-section">
        <div class="price-label">Стоимость техники:</div>
        <div class="price-value">${formattedPrice} руб.</div>
        ${offer.vat_included && formattedPriceWithVat ? `
          <div class="price-vat">Стоимость с НДС: ${formattedPriceWithVat} руб.</div>
        ` : ""}
        <ul class="conditions-list">
          ${offer.availability ? `<li>${escapeHtml(offer.availability)}</li>` : ""}
          ${offer.lease ? `<li>Продажа в лизинг.</li>` : ""}
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
