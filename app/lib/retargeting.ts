export class RetargetingPixels {
  // Google Ads Conversion Tracking
  static trackGoogleConversion(conversionId: string, conversionLabel: string, value?: number) {
    if (typeof window === "undefined") return

    // Google Global Site Tag (gtag.js)
    if ((window as any).gtag) {
      ;(window as any).gtag("event", "conversion", {
        send_to: `${conversionId}/${conversionLabel}`,
        value: value || 1,
        currency: "RUB",
      })
      console.log("[v0] Google conversion tracked")
    }
  }

  // Facebook Pixel tracking
  static trackFacebookPixel(event: "Lead" | "Purchase" | "ViewContent" | "AddToCart", data?: Record<string, any>) {
    if (typeof window === "undefined") return

    if ((window as any).fbq) {
      ;(window as any).fbq("track", event, data)
      console.log(`[v0] Facebook pixel '${event}' tracked`)
    }
  }

  // Yandex Metrica conversion
  static trackYandexMetrica(goalId: string, data?: Record<string, any>) {
    if (typeof window === "undefined") return

    if ((window as any).ym) {
      ;(window as any).ym(goalId, "reachGoal", "lead", data)
      console.log("[v0] Yandex Metrica goal tracked")
    }
  }

  // VK Pixel tracking
  static trackVKPixel(pixelId: string, eventName: string) {
    if (typeof window === "undefined") return

    if ((window as any).VK) {
      ;(window as any).VK.Retargeting.Event(pixelId, eventName)
      console.log(`[v0] VK pixel '${eventName}' tracked`)
    }
  }
}

// Event tracking for forms and CTAs
export const RETARGETING_EVENTS = {
  FORM_VIEW: "form_view",
  FORM_START: "form_start",
  FORM_COMPLETE: "form_complete",
  CTA_CLICK: "cta_click",
  PRODUCT_VIEW: "product_view",
  LEAD_GENERATED: "lead_generated",
  HIGH_VALUE_LEAD: "high_value_lead",
}
