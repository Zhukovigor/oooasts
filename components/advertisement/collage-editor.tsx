"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

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
}

export default function AdvertisementModal() {
  const [ad, setAd] = useState<Advertisement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [canClose, setCanClose] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadAdvertisement()
    const timer = setInterval(loadAdvertisement, 60000) // Проверка каждую минуту
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
        setIsVisible(true)
        setTimeLeft(data.display_duration_seconds)
        setCanClose(data.close_delay_seconds === 0)
        setIsClosing(false)

        await supabase
          .from("advertisements")
          .update({
            shows_today: data.shows_today + 1,
            total_views: data.total_views + 1,
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
        
        // Проверяем, можно ли показывать кнопку закрытия
        if (!canClose && newTime <= ad.display_duration_seconds - ad.close_delay_seconds) {
          setCanClose(true)
        }
        
        // Автоматическое закрытие по истечении времени
        if (newTime <= 0) {
          handleAutoClose()
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, ad, canClose])

  const handleAutoClose = async () => {
    if (!ad) return
    setIsClosing(true)
    
    // Небольшая задержка для анимации
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
    }, 300)
  }

  const handleClose = async () => {
    if (!ad || !canClose) return

    try {
      await supabase
        .from("advertisements")
        .update({ total_clicks: (ad.total_clicks || 0) + 1 })
        .eq("id", ad.id)
    } catch (error) {
      console.error("Error updating clicks:", error)
    }

    setIsClosing(true)
    setTimeout(() => {
      setIsVisible(false)
      setIsClosing(false)
    }, 300)
  }

  const handleButtonClick = async () => {
    if (!ad) return

    try {
      await supabase
        .from("advertisements")
        .update({ total_clicks: (ad.total_clicks || 0) + 1 })
        .eq("id", ad.id)
    } catch (error) {
      console.error("Error updating clicks:", error)
    }
  }

  if (!isVisible || !ad) return null

  const bgOpacity = (ad.background_opacity || 0.8) as number

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: `rgba(0, 0, 0, ${bgOpacity})` }}
    >
      <div
        style={{
          backgroundColor: ad.background_color,
          color: ad.text_color,
          width: ad.width,
          height: ad.height,
          maxWidth: "90vw",
          maxHeight: "80vh",
        }}
        className={`rounded-lg shadow-2xl p-6 relative flex overflow-hidden transition-transform duration-300 ${
          isClosing ? 'scale-95' : 'scale-100'
        }`}
      >
        <div className="absolute top-4 left-4 text-xs font-bold opacity-70">РЕКЛАМА</div>

        {/* Close button / Timer */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {canClose ? (
            <button
              onClick={handleClose}
              className="text-2xl font-bold hover:opacity-70 transition-opacity leading-none w-6 h-6 flex items-center justify-center"
              style={{ color: ad.text_color }}
            >
              ×
            </button>
          ) : (
            <div 
              className="text-xs font-medium opacity-70 px-2 py-1 rounded"
              style={{ 
                backgroundColor: `${ad.text_color}20`,
                color: ad.text_color
              }}
            >
              {timeLeft}s
            </div>
          )}
        </div>

        {/* Image Section */}
        {ad.image_url && (
          <div className="flex-shrink-0 w-1/2 mr-4">
            <img
              src={ad.image_url || "/placeholder.svg"}
              alt={ad.title}
              className="w-full h-full rounded-lg object-cover"
            />
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-between pt-8 pb-6 pl-2">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold leading-tight">{ad.title}</h2>
            {ad.description && (
              <p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap">
                {ad.description}
              </p>
            )}
          </div>

          {/* Timer Info */}
          <div className="text-xs opacity-70 mt-2">
            {canClose ? (
              <p>Вы можете закрыть это окно</p>
            ) : (
              <p>Автоматическое закрытие через {timeLeft} секунд</p>
            )}
          </div>

          {/* Button */}
          {ad.button_url && (
            <a
              href={ad.button_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleButtonClick}
              style={{ backgroundColor: ad.button_color }}
              className="py-2 px-4 text-center font-semibold rounded-lg text-white hover:opacity-90 transition-opacity text-sm mt-4"
            >
              {ad.button_text}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
