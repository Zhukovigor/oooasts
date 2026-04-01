"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function RetargetingProvider() {
  const pathname = usePathname()

  useEffect(() => {
    // Load Google Analytics with conversion tracking
    const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
    if (googleAnalyticsId) {
      const script = document.createElement("script")
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`
      document.head.appendChild(script)

      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        window.dataLayer.push(arguments)
      }
      ;(window as any).gtag = gtag
      gtag("js", new Date())
      gtag("config", googleAnalyticsId)
    }

    // Load Facebook Pixel
    const fbPixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
    if (fbPixelId) {
      ;(window as any).fbq =
        (window as any).fbq ||
        (() => {
          ;(window as any).fbq.callMethod
            ? (window as any).fbq.callMethod.apply((window as any).fbq, arguments)
            : ((window as any).fbq.queue = (window as any).fbq.queue || []).push(arguments)
        })
      ;(window as any).fbq("init", fbPixelId)
      ;(window as any).fbq("track", "PageView")

      const fbScript = document.createElement("script")
      fbScript.async = true
      fbScript.src = "https://connect.facebook.net/ru_RU/fbevents.js"
      document.head.appendChild(fbScript)
    }

    // Load Yandex Metrica
    const yandexMetricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID
    if (yandexMetricaId) {
      ;(window as any).ym =
        (window as any).ym ||
        (() => {
          ;(window as any).ym.a = (window as any).ym.a || []
          ;(window as any).ym.a.push(arguments)
        })
      ;(window as any).ym(yandexMetricaId, "init", {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
      })

      const ymScript = document.createElement("script")
      ymScript.async = true
      ymScript.src = `https://cdn.jsdelivr.net/npm/yandex-metrica-watch/tag.js`
      ymScript.onload = () => {
        ;(window as any).ym(yandexMetricaId, "pageView")
      }
      document.head.appendChild(ymScript)
    }
  }, [])

  return null
}
