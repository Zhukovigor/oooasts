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

  // Функция для получения стилей текста
  const getTextStyle = () => {
    if (!textOverlay) return {}
    
    const shadow = textOverlay.shadow
    const shadowStyle = shadow?.enabled 
      ? `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`
      : "none"

    return {
      fontSize: `${textOverlay.fontSize}px`,
      fontFamily: textOverlay.fontFamily,
      fontWeight: textOverlay.fontWeight,
      fontStyle: textOverlay.fontStyle,
      textDecoration: textOverlay.textDecoration,
      textAlign: textOverlay.textAlign as any,
      color: textOverlay.color,
      opacity: textOverlay.opacity,
      margin: 0,
      textShadow: shadowStyle,
      transform: `rotate(${textOverlay.rotation}deg)`,
      maxWidth: `${textOverlay.maxWidth}%`,
      wordWrap: "break-word" as const,
      overflowWrap: "break-word" as const,
      whiteSpace: "pre-wrap" as const,
      wordBreak: "break-word" as const,
      lineHeight: 1.4,
      pointerEvents: 'none' as const,
    }
  }

  // Функция для получения стилей фона текста
  const getBackgroundStyle = () => {
    if (!textOverlay) return {}
    
    return {
      backgroundColor: textOverlay.backgroundColor,
      opacity: textOverlay.backgroundOpacity,
      padding: `${textOverlay.padding}px`,
      borderRadius: `${textOverlay.borderRadius}px`,
      width: "fit-content",
      maxWidth: "100%",
      pointerEvents: 'none' as const,
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
          backgroundColor: ad.background_color,
          color: ad.text_color,
          width: ad.width || "800px",
          height: ad.height || "500px",
          maxWidth: "90vw",
          maxHeight: "90vh",
        }}
        className="rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 flex flex-col md:flex-row overflow-hidden"
      >
        {/* Close button / Timer */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {canClose ? (
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all duration-200 text-lg font-bold"
              style={{ color: ad.text_color }}
            >
              ×
            </button>
          ) : (
            <div 
              className="px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 backdrop-blur-sm"
              style={{ color: ad.text_color }}
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
            
            {/* Текстовый оверлей поверх изображения */}
            {textOverlay?.enabled && textOverlay.text && (
              <div
                className="absolute"
                style={{
                  left: `${textOverlay.x}%`,
                  top: `${textOverlay.y}%`,
                  transform: "translate(-50%, -50%)",
                  ...getBackgroundStyle(),
                }}
              >
                <p style={getTextStyle()}>
                  {textOverlay.text}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-6 md:p-8">
          {/* Заголовок рекламы */}
          <div className="mb-2">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-200 bg-opacity-50">
              РЕКЛАМА
            </span>
          </div>

          {/* Основной контент */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
              {ad.title}
            </h2>
            
            {ad.description && (
              <p className="text-base md:text-lg leading-relaxed opacity-90 mb-6">
                {ad.description}
              </p>
            )}

            {/* Кнопка */}
            {ad.button_url && ad.button_text && (
              <div className="mt-auto pt-4">
                <a
                  href={ad.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  style={{ 
                    backgroundColor: ad.button_color,
                    color: '#ffffff' // Белый текст для лучшей читаемости
                  }}
                  className="inline-block py-3 px-6 text-center font-semibold rounded-lg hover:opacity-90 transition-all duration-200 text-base shadow-lg hover:shadow-xl transform hover:scale-105"
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
