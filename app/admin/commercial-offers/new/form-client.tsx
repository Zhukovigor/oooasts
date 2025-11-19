"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { parseCommercialOfferText } from "@/app/lib/commercial-offer-parser"
import type { CommercialOfferData } from "@/app/lib/commercial-offer-parser"

export default function CommercialOfferForm() {
  const [rawText, setRawText] = useState("")
  const [parsedData, setParsedData] = useState<CommercialOfferData | null>(null)
  const [showParsed, setShowParsed] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([])
  const [offerId, setOfferId] = useState<string | null>(null)

  useState(() => {
    const loadChannels = async () => {
      try {
        const response = await fetch("/api/telegram/channels")
        if (response.ok) {
          const data = await response.json()
          setChannels(data.channels || [])
        }
      } catch (error) {
        console.error("Error loading channels:", error)
      }
    }
    loadChannels()
  }, [])

  const handleParseText = () => {
    const parsed = parseCommercialOfferText(rawText)
    setParsedData(parsed)
    setShowParsed(true)
  }

  const handleSave = async () => {
    if (!parsedData) return

    setLoading(true)
    try {
      const response = await fetch("/api/commercial-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsedData,
          imageUrl,
          postToTelegram: selectedChannels.length > 0,
          channelIds: selectedChannels,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setOfferId(result.id)
        alert("Коммерческое предложение создано успешно!")
      }
    } catch (error) {
      console.error("Error saving offer:", error)
      alert("Ошибка при сохранении КП")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!offerId) return
    window.open(`/api/commercial-offers/${offerId}/pdf`, "_blank")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Создание коммерческого предложения</h1>
        <p className="text-gray-600 mb-8">Заполните данные о технике для автоматического формирования КП</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Input */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Введите данные</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Текст с характеристиками</label>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Вставьте полный текст с информацией о технике, ценой, оплатой и характеристиками..."
                  className="min-h-80 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">URL фото техники</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="p-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Опубликовать в Telegram</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                  {channels.length === 0 ? (
                    <p className="text-sm text-gray-500">Каналы не добавлены</p>
                  ) : (
                    channels.map((channel) => (
                      <label key={channel.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedChannels.includes(channel.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChannels([...selectedChannels, channel.id])
                            } else {
                              setSelectedChannels(selectedChannels.filter((id) => id !== channel.id))
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-700">{channel.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleParseText}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition"
                >
                  Распарсить характеристики
                </Button>
              </div>
            </div>
          </div>

          {/* Right side - Preview */}
          {showParsed && parsedData && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Предпросмотр</h2>

              <div className="space-y-6">
                {/* Title */}
                {parsedData.title && (
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 leading-tight">{parsedData.title}</h3>
                  </div>
                )}

                {/* Price Box */}
                {parsedData.price && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
                    <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Стоимость техники:</div>
                    <div className="text-4xl font-bold text-blue-900 mb-2">{parsedData.price.toLocaleString('ru-RU')} руб.</div>
                    {parsedData.priceWithVat && (
                      <div className="text-sm text-blue-700">Стоимость с НДС: <span className="font-semibold">{parsedData.priceWithVat.toLocaleString('ru-RU')} руб.</span></div>
                    )}
                  </div>
                )}

                {/* Conditions */}
                <div className="space-y-2">
                  {parsedData.availability && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Наличие:</span>
                      <span className="text-sm font-semibold text-gray-900">{parsedData.availability}</span>
                    </div>
                  )}
                  {parsedData.paymentType && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Оплата:</span>
                      <span className="text-sm font-semibold text-gray-900">{parsedData.paymentType}</span>
                    </div>
                  )}
                  {parsedData.diagnosticsPassed && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm font-medium text-green-700">✓ Диагностика пройдена</span>
                    </div>
                  )}
                </div>

                {/* Specifications */}
                {parsedData.specifications && Object.keys(parsedData.specifications).length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Характеристики</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {Object.entries(parsedData.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 px-3 border-b border-gray-200">
                          <span className="text-sm text-gray-600">{key}:</span>
                          <span className="text-sm font-semibold text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition"
                  >
                    {loading ? "Сохранение..." : "Сохранить КП"}
                  </Button>
                  {offerId && (
                    <Button
                      onClick={handleDownloadPDF}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                    >
                      📥 Скачать PDF
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
