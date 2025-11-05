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

  // Функция для форматирования текста - УЛУЧШЕННАЯ
  const formatText = (text: string) => {
    if (!text) return ""
    
    // Убираем лишние пробелы и переносы
    let formattedText = text.trim()
    
    // Заменяем двойные переносы на разделители
    formattedText = formattedText.replace(/\n\s*\n/g, '\n\n')
    
    // Убираем маркдаун-синтаксис если он есть
    formattedText = formattedText.replace(/^#+\s*/gm, '') // Убираем #
    formattedText = formattedText.replace(/^---$/gm, '') // Убираем разделители
    
    return formattedText
  }

  // Функция для рендеринга форматированного текста
  const renderFormattedText = (text: string) => {
    const formattedText = formatText(text)
    const lines = formattedText.split('\n')
    
    return lines.map((line, index) => {
      if (line.trim() === '') {
        return <div key={index} className="h-4" /> // Пустая строка
      }
      
      // Определяем стиль в зависимости от содержания
      let className = "text-base leading-relaxed"
      
      if (line.includes('л.с.') || line.includes('клиренс') || line.includes('камеры')) {
        // Характеристики - меньший шрифт
        className = "text-sm leading-relaxed opacity-90"
      } else if (line.length < 30 && !line.includes('.')) {
        // Заголовок - крупный жирный
        className = "text-xl font-bold leading-tight"
      } else if (line.includes('Dongfeng') || line.includes('HUGE')) {
        // Подзаголовок - средний жирный
        className = "text-lg font-semibold leading-tight"
      }
      
      return (
        <p key={index} className={className}>
          {line}
        </p>
      )
    })
  }

  // Функция для получения стилей текста
  const getTextStyle = () => {
    if (!textOverlay) return {}
    
    const shadow = textOverlay.shadow
    const shadowStyle = shadow?.enabled 
      ? `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`
      : "none"

    return {
      fontSize: `${textOverlay.fontSize || 18}px`,
      fontFamily: textOverlay.fontFamily || 'Arial, sans-serif',
      fontWeight: textOverlay.fontWeight || 'normal',
      fontStyle: textOverlay.fontStyle || 'normal',
      textDecoration: textOverlay.textDecoration || 'none',
      textAlign: (textOverlay.textAlign || 'left') as any,
      color: textOverlay.color || '#ffffff',
      opacity: textOverlay.opacity || 1,
      margin: 0,
      textShadow: shadowStyle,
      transform: `rotate(${textOverlay.rotation || 0}deg)`,
      maxWidth: `${textOverlay.maxWidth || 90}%`,
      wordWrap: "break-word",
      overflowWrap: "break-word",
      whiteSpace: "pre-wrap",
      wordBreak: "normal",
      lineHeight: 1.4,
      letterSpacing: '0.01em',
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      pointerEvents: 'none' as const,
    }
  }

  // Функция для получения стилей фона текста
  const getBackgroundStyle = () => {
    if (!textOverlay) return {}
    
    return {
      backgroundColor: textOverlay.backgroundColor || 'rgba(0, 0, 0, 0.7)',
      opacity: textOverlay.backgroundOpacity || 0.8,
      padding: `${textOverlay.padding || 20}px`,
      borderRadius: `${textOverlay.borderRadius || 12}px`,
      width: "auto",
      maxWidth: "85%",
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'left' as const,
      pointerEvents: 'none' as const,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
    }
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
          backgroundColor: ad.background_color || '#1a365d',
          color: ad.text_color || '#ffffff',
          width: ad.width || '900px',
          height: ad.height || '600px',
          maxWidth: '95vw',
          maxHeight: '95vh',
        }}
        className="rounded-2xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row overflow-hidden border-2 border-blue-500/20"
      >
        {/* Close button / Timer */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {canClose ? (
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all duration-200 text-lg font-bold backdrop-blur-sm border border-white/30"
              style={{ color: ad.text_color || '#ffffff' }}
            >
              ×
            </button>
          ) : (
            <div 
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-white bg-opacity-20 backdrop-blur-sm border border-white/30"
              style={{ color: ad.text_color || '#ffffff' }}
            >
              {timeLeft}s
            </div>
          )}
        </div>

        {/* Image Section */}
        {ad.image_url && (
          <div className="flex-1 relative min-h-[250px] md:min-h-0">
            <img
              src={ad.image_url || "/placeholder.svg"}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
            
            {/* Текстовый оверлей поверх изображения */}
            {textOverlay?.enabled && textOverlay.text && (
              <div
                className="absolute inset-0 flex items-center justify-center p-6"
              >
                <div
                  style={getBackgroundStyle()}
                  className="text-left"
                >
                  <div style={getTextStyle()}>
                    {renderFormattedText(textOverlay.text)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-6 md:p-8 bg-gradient-to-br from-blue-900/90 to-blue-800/90">
          {/* Заголовок рекламы */}
          <div className="mb-6">
            <span 
              className="text-xs font-bold px-3 py-1.5 rounded-full inline-block border border-yellow-400/50"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#fbbf24',
                backdropFilter: 'blur(10px)'
              }}
            >
              🚗 АВТОМОБИЛИ • РЕКЛАМА
            </span>
          </div>

          {/* Основной контент */}
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {/* Заголовок */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-3 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                {ad.title}
              </h2>
              
              {ad.description && (
                <div className="space-y-3 text-blue-100">
                  {renderFormattedText(ad.description)}
                </div>
              )}
            </div>

            {/* Характеристики в виде иконок */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-400">⚡</span>
                <span>197 л.с.</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-400">🔍</span>
                <span>Камеры 360°</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-400">🛡️</span>
                <span>Клиренс 20 см</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-400">🌅</span>
                <span>Панорамная крыша</span>
              </div>
            </div>

            {/* Кнопка */}
            {ad.button_url && ad.button_text && (
              <div className="mt-8">
                <a
                  href={ad.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  style={{ 
                    backgroundColor: ad.button_color || '#f59e0b',
                    color: '#1e293b'
                  }}
                  className="inline-block py-4 px-8 text-center font-bold rounded-xl hover:opacity-90 transition-all duration-200 text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 border-2 border-yellow-400/50"
                >
                  {ad.button_text} →
                </a>
              </div>
            )}
          </div>

          {/* Футер */}
          <div className="mt-6 pt-4 border-t border-blue-700/50">
            <p className="text-xs text-blue-300 text-center">
              Dongfeng HUGE • Семейный кроссовер • 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
