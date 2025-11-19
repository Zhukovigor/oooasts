"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { parseCommercialOfferText, formatSpecsForTable } from "@/app/lib/commercial-offer-parser"
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

  useEffect(() => {
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

  const specsRows = parsedData ? formatSpecsForTable(parsedData.specifications || {}) : []

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Создание коммерческого предложения</h1>
        <p className="text-gray-600 mb-8">Заполните данные о технике для автоматического формирования КП</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая часть - Ввод данных */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Введите данные</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Текст с характеристиками</label>
                <Textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Вставьте полный текст с информацией о технике..."
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

          {/* Правая часть - Предпросмотр */}
          {showParsed && parsedData && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Предпросмотр КП</h2>

              <div className="space-y-6">
                {/* Заголовок - по центру */}
                <div className="text-center border-b-2 border-blue-500 pb-4">
                  <h1 className="text-xl font-bold uppercase mb-2">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
                  <div className="text-lg font-bold">СЕДЕЛЬНЫЙ ТЯГАЧ</div>
                  {parsedData.title && <div className="text-xl font-bold text-blue-600 mt-1">{parsedData.title}</div>}
                </div>

                {/* Основной контент: фото слева, цена справа - книжная раскладка */}
                <div className="grid grid-cols-2 gap-6 min-h-80">
                  {/* Левая колонка - фото */}
                  {imageUrl && (
                    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center p-4">
                      <img 
                        src={imageUrl} 
                        alt="техника" 
                        className="w-full h-auto max-h-72 object-contain rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                  )}

                  {/* Правая колонка - цена и условия */}
                  {parsedData.price && (
                    <div className="border-2 border-gray-300 rounded-lg bg-white p-6 flex flex-col justify-between">
                      <div>
                        <div className="text-base font-bold text-black mb-3">Стоимость техники:</div>
                        <div className="text-3xl font-bold text-black mb-4">{parsedData.price.toLocaleString('ru-RU')} руб.</div>
                        <div className="space-y-2 mb-6">
                          {parsedData.priceWithVat && <div className="text-sm text-black">Стоимость с НДС.</div>}
                          {parsedData.availability && <div className="text-sm text-black">В наличии.</div>}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-black">
                        {parsedData.lease && <div className="flex items-center">• Продажа в лизинг.</div>}
                        {parsedData.paymentType && <div className="flex items-center">• Безналичная оплата с НДС.</div>}
                        {parsedData.diagnosticsPassed && <div className="flex items-center">• Диагностика пройдена.</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Таблица технических характеристик */}
                {specsRows.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 text-center border-b-2 border-blue-500 pb-2">
                      Технические характеристики
                    </h3>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <tbody>
                          {specsRows.flat().map(([key, value], index) => (
                            <tr key={index} className="border-b border-gray-300 last:border-b-0">
                              <td className="py-3 px-4 border-r border-gray-300 bg-gray-50 font-semibold text-gray-700 w-2/5">
                                {key}
                              </td>
                              <td className="py-3 px-4 text-gray-900 w-3/5">
                                {value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Кнопки действий */}
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
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
                      Скачать PDF
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
