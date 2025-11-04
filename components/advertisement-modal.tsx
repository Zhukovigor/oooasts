"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

interface TextOverlay {
  enabled?: boolean
  text?: string
  x?: number
  y?: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textDecoration?: string
  textAlign?: string
  color?: string
  opacity?: number
  backgroundColor?: string
  backgroundOpacity?: number
  padding?: number
  borderRadius?: number
  maxWidth?: number
  rotation?: number
  shadow?: {
    enabled?: boolean
    color?: string
    blur?: number
    offsetX?: number
    offsetY?: number
  }
}

interface Advertisement {
  id: string
  title: string
  description: string
  image_url: string
  button_text: string
  button_url: string
  is_active: boolean
  start_date: string
  end_date: string
  display_duration_seconds: number
  close_delay_seconds: number
  max_shows_per_day: number
  shows_today: number
  background_color: string
  text_color: string
  button_color: string
  width: string
  height: string
  background_opacity: number
  text_overlay?: string
}

export default function AdvertisementModal() {
  const [ad, setAd] = useState<Advertisement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [canClose, setCanClose] = useState(false)
  const [textOverlay, setTextOverlay] = useState<TextOverlay | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadAdvertisement()
    const timer = setInterval(loadAdvertisement, 60000)
    return () => clearInterval(timer)
  }, [])

  const loadAdvertisement = async () => {
    try {
      const now = new Date()
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .eq("is_active", true)
        .or(
          `and(start_date.is.null,end_date.is.null),and(start_date.lte.${now.toISOString()},end_date.is.null),and(start_date.is.null,end_date.gte.${now.toISOString()}),and(start_date.lte.${now.toISOString()},end_date.gte.${now.toISOString()})`,
        )
        .limit(1)
        .maybeSingle()

      if (error) throw error

      if (data && data.shows_today < data.max_shows_per_day) {
        setAd(data)
        
        // Парсим конфигурацию текста если она есть
        if (data.text_overlay) {
          try {
            const parsedTextOverlay = JSON.parse(data.text_overlay.replace(/\\"/g, '"').replace(/^"|"$/g, ''))
            setTextOverlay(parsedTextOverlay)
          } catch (parseError) {
            console.error("Error parsing text overlay:", parseError)
            setTextOverlay(null)
          }
        } else {
          setTextOverlay(null)
        }
        
        setIsVisible(true)
        setTimeLeft(data.display_duration_seconds)
        setCanClose(false)

        await supabase
          .from("advertisements")
          .update({
            shows_today: data.shows_today + 1,
            total_views: (data.total_views || 0) + 1,
            last_shown_at: now.toISOString(),
          })
          .eq("id", data.id)
      }
    } catch (error) {
      console.error("Error loading advertisement:", error)
    }
  }

  useEffect(() => {
    if (!isVisible || !ad) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1
        if (newTime <= ad.close_delay_seconds) {
          setCanClose(true)
        }
        if (newTime <= 0) {
          setIsVisible(false)
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, ad])

  const handleClose = async () => {
    if (!ad) return

    try {
      await supabase
        .from("advertisements")
        .update({ total_clicks: (ad.total_clicks || 0) + 1 })
        .eq("id", ad.id)
    } catch (error) {
      console.error("Error updating clicks:", error)
    }

    setIsVisible(false)
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && canClose) {
      handleClose()
    }
  }

  // Функция для получения стилей текста - УЛУЧШЕННАЯ
  const getTextStyle = () => {
    if (!textOverlay) return {}
    
    const shadow = textOverlay.shadow
    const shadowStyle = shadow?.enabled 
      ? `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`
      : "none"

    return {
      fontSize: `${textOverlay.fontSize || 24}px`,
      fontFamily: textOverlay.fontFamily || 'Arial, sans-serif',
      fontWeight: textOverlay.fontWeight || 'normal',
      fontStyle: textOverlay.fontStyle || 'normal',
      textDecoration: textOverlay.textDecoration || 'none',
      textAlign: (textOverlay.textAlign || 'center') as any,
      color: textOverlay.color || '#ffffff',
      opacity: textOverlay.opacity || 1,
      margin: 0,
      textShadow: shadowStyle,
      transform: `rotate(${textOverlay.rotation || 0}deg)`,
      maxWidth: `${textOverlay.maxWidth || 80}%`,
      // КРИТИЧЕСКИ ВАЖНЫЕ НАСТРОЙКИ ДЛЯ КРАСИВОГО ТЕКСТА:
      wordWrap: "break-word",
      overflowWrap: "break-word",
      whiteSpace: "pre-line", // Сохраняет переносы строк, но не пробелы
      wordBreak: "normal", // Не разрываем слова без необходимости
      lineHeight: 1.3, // Оптимальный межстрочный интервал
      letterSpacing: '0.02em', // Немного увеличиваем межбуквенный интервал
      textAlign: 'center' as const, // Центрируем текст
      // Гарантируем читаемость:
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      pointerEvents: 'none' as const,
    }
  }

  // Функция для получения стилей фона текста - УЛУЧШЕННАЯ
  const getBackgroundStyle = () => {
    if (!textOverlay) return {}
    
    return {
      backgroundColor: textOverlay.backgroundColor || '#000000',
      opacity: textOverlay.backgroundOpacity || 0.7,
      padding: `${textOverlay.padding || 16}px ${textOverlay.padding || 20}px`,
      borderRadius: `${textOverlay.borderRadius || 8}px`,
      width: "auto",
      maxWidth: "90%",
      // Центрируем блок с текстом:
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center' as const,
      pointerEvents: 'none' as const,
      // Добавляем тень для лучшего отделения от фона:
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    }
  }

  // Функция для форматирования текста - разбивает на строки правильно
  const formatText = (text: string) => {
    if (!text) return ""
    
    // Заменяем двойные пробелы на одинарные
    let formattedText = text.replace(/\s+/g, ' ')
    
    // Добавляем переносы после пунктуации для лучшего вида
    formattedText = formattedText.replace(/([.!?])\s*/g, '$1\n')
    
    // Ограничиваем максимальную длину строки
    const words = formattedText.split(' ')
    const lines = []
    let currentLine = ''
    
    for (const word of words) {
      if ((currentLine + word).length <= 25) { // Максимум 25 символов в строке
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    
    if (currentLine) lines.push(currentLine)
    
    return lines.join('\n')
  }

  if (!isVisible || !ad) return null

  const bgOpacity = (ad.background_opacity || 0.8) as number

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4"
      style={{ backgroundColor: `rgba(0, 0, 0, ${bgOpacity})` }}
      onClick={handleBackgroundClick}
    >
      <div
        style={{
          backgroundColor: ad.background_color || '#ffffff',
          color: ad.text_color || '#000000',
          width: ad.width || '800px',
          height: ad.height || '500px',
          maxWidth: '90vw',
          maxHeight: '90vh',
        }}
        className="rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row overflow-hidden"
      >
        {/* Close button / Timer */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {canClose ? (
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all duration-200 text-lg font-bold backdrop-blur-sm"
              style={{ color: ad.text_color || '#000000' }}
            >
              ×
            </button>
          ) : (
            <div 
              className="px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 backdrop-blur-sm"
              style={{ color: ad.text_color || '#000000' }}
            >
              {timeLeft}s
            </div>
          )}
        </div>

        {/* Image Section */}
        {ad.image_url && (
          <div className="flex-1 relative min-h-[200px] md:min-h-0">
            <img
              src={ad.image_url || "/placeholder.svg"}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
            
            {/* Текстовый оверлей поверх изображения - УЛУЧШЕННЫЙ */}
            {textOverlay?.enabled && textOverlay.text && (
              <div
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                <div
                  style={getBackgroundStyle()}
                  className="text-center"
                >
                  <p style={getTextStyle()}>
                    {formatText(textOverlay.text)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-6 md:p-8">
          {/* Заголовок рекламы */}
          <div className="mb-4">
            <span 
              className="text-xs font-semibold px-3 py-1 rounded-full inline-block"
              style={{ 
                backgroundColor: `${ad.text_color}15`,
                color: ad.text_color 
              }}
            >
              РЕКЛАМА
            </span>
          </div>

          {/* Основной контент */}
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              {ad.title}
            </h2>
            
            {ad.description && (
              <p className="text-base md:text-lg leading-relaxed opacity-90">
                {ad.description}
              </p>
            )}

            {/* Кнопка */}
            {ad.button_url && ad.button_text && (
              <div className="mt-6">
                <a
                  href={ad.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  style={{ 
                    backgroundColor: ad.button_color || '#007bff',
                    color: '#ffffff'
                  }}
                  className="inline-block py-3 px-8 text-center font-semibold rounded-lg hover:opacity-90 transition-all duration-200 text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {ad.button_text}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
