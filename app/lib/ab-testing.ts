import { createBrowserClient } from "@supabase/ssr"

export interface ABTestVariant {
  id: string
  campaign_id: string
  variant_name: string
  variant_key: string
  traffic_weight: number
  configuration: Record<string, any>
}

export interface ABTestResult {
  sessionId: string
  campaignId: string
  variantId: string
  views: number
  interactions: number
  conversions: number
}

export class ABTestManager {
  private static SESSION_STORAGE_KEY = "ab_test_variants"

  // Get assigned variant for user based on traffic weight
  static assignVariant(variants: ABTestVariant[]): ABTestVariant {
    const sessionId = this.getSessionId()
    const hash = this.hashString(sessionId)
    const normalizedHash = (hash % 100) + 1

    let weightAccumulator = 0
    for (const variant of variants) {
      weightAccumulator += variant.traffic_weight
      if (normalizedHash <= weightAccumulator) {
        this.saveVariantToSession(variant.campaign_id, variant.id)
        return variant
      }
    }

    return variants[0]
  }

  // Track impression (page view)
  static async trackImpression(campaignId: string, variantId: string) {
    const supabase = createBrowserClient()
    try {
      await supabase.from("ab_test_results").insert({
        campaign_id: campaignId,
        variant_id: variantId,
        session_id: this.getSessionId(),
        views: 1,
      })
    } catch (error) {
      console.error("[v0] A/B test impression error:", error)
    }
  }

  // Track interaction (form focus, button hover, etc)
  static async trackInteraction(campaignId: string, variantId: string) {
    const supabase = createBrowserClient()
    try {
      const { data: existing } = await supabase
        .from("ab_test_results")
        .select("id, interactions")
        .eq("campaign_id", campaignId)
        .eq("variant_id", variantId)
        .eq("session_id", this.getSessionId())
        .single()

      if (existing) {
        await supabase
          .from("ab_test_results")
          .update({ interactions: existing.interactions + 1 })
          .eq("id", existing.id)
      }
    } catch (error) {
      console.error("[v0] A/B test interaction error:", error)
    }
  }

  // Track conversion (form submission)
  static async trackConversion(campaignId: string, variantId: string, value?: number) {
    const supabase = createBrowserClient()
    try {
      const { data: existing } = await supabase
        .from("ab_test_results")
        .select("id, conversions")
        .eq("campaign_id", campaignId)
        .eq("variant_id", variantId)
        .eq("session_id", this.getSessionId())
        .single()

      if (existing) {
        await supabase
          .from("ab_test_results")
          .update({
            conversions: existing.conversions + 1,
            converted_at: new Date().toISOString(),
            conversion_value: value || null,
          })
          .eq("id", existing.id)
      } else {
        await supabase.from("ab_test_results").insert({
          campaign_id: campaignId,
          variant_id: variantId,
          session_id: this.getSessionId(),
          conversions: 1,
          converted_at: new Date().toISOString(),
          conversion_value: value || null,
        })
      }
    } catch (error) {
      console.error("[v0] A/B test conversion error:", error)
    }
  }

  private static getSessionId(): string {
    if (typeof window === "undefined") return "server"
    const stored = localStorage.getItem("ab_test_session_id")
    if (stored) return stored

    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem("ab_test_session_id", sessionId)
    return sessionId
  }

  private static saveVariantToSession(campaignId: string, variantId: string) {
    if (typeof window === "undefined") return
    const stored = JSON.parse(localStorage.getItem(this.SESSION_STORAGE_KEY) || "{}")
    stored[campaignId] = variantId
    localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(stored))
  }

  private static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }
}
