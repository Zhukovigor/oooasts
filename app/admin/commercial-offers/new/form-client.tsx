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
  const [parsing, setParsing] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([])
  const [offerId, setOfferId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadChannels = async () => {
      try {
        const response = await fetch("/api/telegram/channels")
        if (response.ok) {
          const data = await response.json()
          setChannels(data.channels || [])
        } else {
          setError("Не удалось загрузить список каналов")
        }
      } catch (error) {
        console.error("Error loading channels:", error)
        setError("Ошибка подключения к серверу")
      }
    }
    loadChannels()
  }, [])

  const validateForm = () => {
    if (!parsedData) {
      setError("Сначала распарсьте характеристики")
      return false
    }

    if (!parsedData.title) {
      setError("Не удалось распознать название техники")
      return false
    }

    if (!parsedData.price) {
      setError("Не удалось распознать цену техники")
      return false
    }

    if (imageUrl && !isValidImageUrl(imageUrl)) {
      setError("Некорректный URL изображения")
      return false
    }

    return true
  }

  const isValidImageUrl = (url: string) => {
    try {
      new URL(url)
      return /\.(jpg|jpeg|png|webp|gif)$/i.test(url)
    } catch {
      return false
    }
  }

  const handleParseText = () => {
    if (!rawText.trim()) {
      setError("Введите текст с характеристиками")
      return
    }

    setParsing(true)
    setError(null)
    setSuccess(null)
    
    try {
      const parsed = parseCommercialOfferText(rawText)
      
      if (!parsed.title && !parsed.price) {
        setError("Не удалось распознать основные данные. Проверьте формат текста.")
        return
      }
      
      setParsedData(parsed)
      setShowParsed(true)
      setSuccess("Данные успешно обработаны!")
    } catch (err) {
      console.error("Ошибка парсинга:", err)
      setError("Произошла ошибка при обработке текста")
    } finally {
      setParsing(false)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError(null)

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
        setSuccess("Коммерческое предложение создано успешно!")
        
        // Автоматическая прокрутка к кнопке скачивания PDF
        setTimeout(() => {
          const pdfButton = document.getElementById('download-pdf-button')
          pdfButton?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Ошибка при сохранении КП")
      }
    } catch (error) {
      console.error("Error saving offer:", error)
      setError("Ошибка подключения к серверу")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!offerId) return
    window.open(`/api/commercial-offers/${offerId}/pdf`, "_blank")
  }

  const handleReset = () => {
    setRawText("")
    setParsedData(null)
    setShowParsed(false)
    setImageUrl("")
    setSelectedChannels([])
    setOfferId(null)
    setError(null)
    setSuccess(null)
  }

  const handleExampleLoad = () => {
    const exampleText = `Седельный тягач Volvo FH 500 2022 года выпуска

Цена: 15 800 000 руб.
Цена с НДС: 18 700 000 руб.
Наличие: в наличии на складе
Лизинг: доступна покупка в лизинг
Форма оплаты: безналичный расчет
Диагностика: пройдена полная диагностика

ХАРАКТЕРИСТИКИ:
Двигатель: 500 л.с.
Коробка передач: автоматическая 12-ступенчатая
Колёсная формула: 4x2
Топливный бак: 2x300 л
Спальное место: есть
Круиз-контроль: адаптивный
Климат-контроль: 3-зонный`

    setRawText(exampleText)
    setError(null)
  }

  const specsRows = parsedData ? formatSpecsForTable(parsedData.specifications || {}) : []

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Создание коммерческого предложения</h1>
          <p className="text-gray-600">Заполните данные о технике для автоматического формирования КП</p>
        </div>

        {/* Уведомления */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-red-600 text-sm font-medium">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-green-600 text-sm font-medium">{success}</div>
              <button 
                onClick={() => setSuccess(null)}
                className="text-green-400 hover:text-green-600 text-lg"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая часть - Ввод данных */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Введите данные</h2>
              {showParsed && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="text-gray-600 border-gray-300"
                >
                  Очистить форму
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Текст с характеристиками *
                  </label>
                  <button
                    onClick={handleExampleLoad}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Загрузить пример
                  </button>
                </div>
                <Textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value)
                    setError(null)
                  }}
                  placeholder="Вставьте полный текст с информацией о технике..."
                  className="min-h-80 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-500 mt-2">
                  Обязательное поле. Вставьте текст с описанием техники, ценой и характеристиками.
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">URL фото техники</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {imageUrl && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Предпросмотр:</div>
                    <div className="border border-gray-300 rounded-lg overflow-hidden max-w-xs">
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Опубликовать в Telegram
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-gray-50">
                  {channels.length === 0 ? (
                    <p className="text-sm text-gray-500">Загрузка каналов...</p>
                  ) : (
                    channels.map((channel) => (
                      <label key={channel.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
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
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{channel.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {selectedChannels.length > 0 && (
                  <div className="text-xs text-green-600 mt-2">
                    Выбрано каналов: {selectedChannels.length}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleParseText}
                  disabled={parsing || !rawText.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {parsing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Обработка...
                    </div>
                  ) : (
                    "Распарсить характеристики"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Правая часть - Предпросмотр */}
          {showParsed && parsedData && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 overflow-y-auto max-h-[calc(100vh-200px)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Предпросмотр КП</h2>

              <div className="space-y-6">
                {/* Заголовок */}
                <div className="border-b-2 border-blue-500 pb-4">
                  <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Коммерческое предложение</div>
                  {parsedData.equipment && <div className="text-sm font-semibold text-gray-600 mb-1">{parsedData.equipment}</div>}
                  {parsedData.title && <h1 className="text-3xl font-bold text-gray-900">{parsedData.title}</h1>}
                </div>

                {/* Изображение и цена */}
                <div className={`grid ${imageUrl ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                  {/* Изображение */}
                  {imageUrl && (
                    <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={imageUrl} 
                        alt="техника" 
                        className="w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                  )}

                  {/* Цена и условия */}
                  {parsedData.price && (
                    <div className={`bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white flex flex-col justify-between ${!imageUrl ? 'col-span-2' : ''}`}>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-90 mb-2">Стоимость техники</div>
                        <div className="text-4xl font-bold mb-6">{parsedData.price.toLocaleString('ru-RU')} руб.</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        {parsedData.priceWithVat && <div className="flex items-center gap-2">✓ Стоимость с НДС</div>}
                        {parsedData.availability && <div className="flex items-center gap-2">✓ {parsedData.availability}</div>}
                        {parsedData.lease && <div className="flex items-center gap-2">✓ Продажа в лизинг</div>}
                        {parsedData.paymentType && <div className="flex items-center gap-2">✓ {parsedData.paymentType}</div>}
                        {parsedData.diagnosticsPassed && <div className="flex items-center gap-2">✓ Диагностика пройдена</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Таблица характеристик */}
                {specsRows.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-3">Технические характеристики</h3>
                    <div className="space-y-3">
                      {specsRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-2 gap-6">
                          {row.map(([key, value], colIndex) => (
                            <div key={colIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition hover:shadow-sm">
                              <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">{key}</div>
                              <div className="text-base font-semibold text-gray-900">{value}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Кнопки действий */}
                <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Сохранение...
                      </div>
                    ) : (
                      "Сохранить КП"
                    )}
                  </Button>
                  
                  {offerId && (
                    <Button
                      id="download-pdf-button"
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
