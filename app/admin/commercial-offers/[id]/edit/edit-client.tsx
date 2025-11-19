"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, ArrowLeft, Plus, Trash2, Eye, Download } from "lucide-react"

interface Specification {
  key: string
  value: string
}

export default function EditOfferClient({ initialOffer }: { initialOffer: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [offer, setOffer] = useState({
    ...initialOffer,
    specifications: Object.entries(initialOffer.specifications || {}).map(([key, value]: [string, any]) => ({
      key,
      value
    })) as Specification[]
  })

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)
    
    try {
      // Преобразуем спецификации обратно в объект
      const specificationsObject: Record<string, string> = {}
      offer.specifications.forEach(spec => {
        if (spec.key.trim() && spec.value.trim()) {
          specificationsObject[spec.key.trim()] = spec.value.trim()
        }
      })

      const dataToSend = {
        ...offer,
        specifications: specificationsObject
      }

      // Удаляем временные поля
      delete dataToSend.specificationsArray

      const response = await fetch(`/api/commercial-offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: "Коммерческое предложение успешно обновлено!" })
        // Перенаправляем через 2 секунды
        setTimeout(() => {
          router.push("/admin/commercial-offers")
        }, 2000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ошибка при сохранении")
      }
    } catch (error) {
      console.error("Error saving offer:", error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : "Ошибка при сохранении" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addSpecification = () => {
    setOffer({
      ...offer,
      specifications: [...offer.specifications, { key: "", value: "" }]
    })
  }

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const updatedSpecs = [...offer.specifications]
    updatedSpecs[index][field] = value
    setOffer({ ...offer, specifications: updatedSpecs })
  }

  const removeSpecification = (index: number) => {
    setOffer({
      ...offer,
      specifications: offer.specifications.filter((_, i) => i !== index)
    })
  }

  const handlePreview = () => {
    window.open(`/api/commercial-offers/${offer.id}/pdf?format=html`, '_blank')
  }

  const handleDownloadPDF = () => {
    window.open(`/api/commercial-offers/${offer.id}/pdf`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin/commercial-offers">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Редактирование КП</h1>
              <p className="text-gray-600 mt-1">ID: {offer.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Предпросмотр
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Основные данные */}
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>Заголовок, описание и основные параметры</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Заголовок *</Label>
                  <Input
                    id="title"
                    value={offer.title || ""}
                    onChange={(e) => setOffer({ ...offer, title: e.target.value })}
                    placeholder="Например: Седельный тягач VOLVO FH 460"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={offer.description || ""}
                    onChange={(e) => setOffer({ ...offer, description: e.target.value })}
                    placeholder="Описание техники"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="equipment">Тип техники</Label>
                  <Input
                    id="equipment"
                    value={offer.equipment || ""}
                    onChange={(e) => setOffer({ ...offer, equipment: e.target.value })}
                    placeholder="Например: Седельный тягач"
                  />
                </div>

                <div>
                  <Label htmlFor="model">Модель</Label>
                  <Input
                    id="model"
                    value={offer.model || ""}
                    onChange={(e) => setOffer({ ...offer, model: e.target.value })}
                    placeholder="Например: FH 460"
                  />
                </div>

                <div>
                  <Label htmlFor="image_url">URL изображения</Label>
                  <Input
                    id="image_url"
                    value={offer.image_url || ""}
                    onChange={(e) => setOffer({ ...offer, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {offer.image_url && (
                    <div className="mt-2">
                      <img 
                        src={offer.image_url} 
                        alt="Preview" 
                        className="h-32 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Технические характеристики */}
            <Card>
              <CardHeader>
                <CardTitle>Технические характеристики</CardTitle>
                <CardDescription>Основные параметры и спецификации техники</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {offer.specifications.map((spec: Specification, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Характеристика"
                      value={spec.key}
                      onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Значение"
                      value={spec.value}
                      onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSpecification(index)}
                      disabled={offer.specifications.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button type="button" variant="outline" onClick={addSpecification}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить характеристику
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Цена и условия */}
            <Card>
              <CardHeader>
                <CardTitle>Цена и условия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="price">Цена (руб.) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={offer.price || 0}
                    onChange={(e) => setOffer({ ...offer, price: Number(e.target.value) })}
                    placeholder="7800000"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="price_with_vat" className="cursor-pointer">С НДС</Label>
                  <Switch
                    id="price_with_vat"
                    checked={offer.price_with_vat || false}
                    onCheckedChange={(checked) => setOffer({ ...offer, price_with_vat: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="vat_included" className="cursor-pointer">НДС включен</Label>
                  <Switch
                    id="vat_included"
                    checked={offer.vat_included || false}
                    onCheckedChange={(checked) => setOffer({ ...offer, vat_included: checked })}
                  />
                </div>

                <div>
                  <Label htmlFor="availability">Наличие</Label>
                  <Input
                    id="availability"
                    value={offer.availability || ""}
                    onChange={(e) => setOffer({ ...offer, availability: e.target.value })}
                    placeholder="В наличии"
                  />
                </div>

                <div>
                  <Label htmlFor="payment_type">Способ оплаты</Label>
                  <Input
                    id="payment_type"
                    value={offer.payment_type || ""}
                    onChange={(e) => setOffer({ ...offer, payment_type: e.target.value })}
                    placeholder="Безналичная оплата"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Дополнительные опции */}
            <Card>
              <CardHeader>
                <CardTitle>Дополнительные опции</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lease" className="cursor-pointer">Лизинг</Label>
                  <Switch
                    id="lease"
                    checked={offer.lease || false}
                    onCheckedChange={(checked) => setOffer({ ...offer, lease: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="diagnostics_passed" className="cursor-pointer">Диагностика пройдена</Label>
                  <Switch
                    id="diagnostics_passed"
                    checked={offer.diagnostics_passed || false}
                    onCheckedChange={(checked) => setOffer({ ...offer, diagnostics_passed: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active" className="cursor-pointer">Активно</Label>
                  <Switch
                    id="is_active"
                    checked={offer.is_active ?? true}
                    onCheckedChange={(checked) => setOffer({ ...offer, is_active: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured" className="cursor-pointer">Рекомендуемое</Label>
                  <Switch
                    id="is_featured"
                    checked={offer.is_featured || false}
                    onCheckedChange={(checked) => setOffer({ ...offer, is_featured: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Действия */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Сохранить изменения
                      </>
                    )}
                  </Button>
                  
                  <Link href="/admin/commercial-offers" className="block">
                    <Button variant="outline" className="w-full">
                      Отмена
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
