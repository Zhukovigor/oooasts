"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { type ABTestVariant, ABTestManager } from "@/app/lib/ab-testing"

export function useABTest(campaignId: string, onVariantAssigned?: (variant: ABTestVariant) => void) {
  const [variant, setVariant] = useState<ABTestVariant | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: variants, error } = await supabase
          .from("ab_test_variants")
          .select("*")
          .eq("campaign_id", campaignId)

        if (error) throw error

        if (variants && variants.length > 0) {
          const assigned = ABTestManager.assignVariant(variants)
          setVariant(assigned)
          await ABTestManager.trackImpression(campaignId, assigned.id)
          onVariantAssigned?.(assigned)
        }
      } catch (error) {
        console.error("[v0] A/B test fetch error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVariants()
  }, [campaignId, onVariantAssigned])

  const trackInteraction = async () => {
    if (variant) {
      await ABTestManager.trackInteraction(campaignId, variant.id)
    }
  }

  const trackConversion = async (value?: number) => {
    if (variant) {
      await ABTestManager.trackConversion(campaignId, variant.id, value)
    }
  }

  return {
    variant,
    isLoading,
    trackInteraction,
    trackConversion,
  }
}
