export const RETARGETING_CONFIG = {
  google: {
    // Get from Google Ads conversion tracking settings
    conversionId: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID || "",
    conversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || "",
  },
  facebook: {
    // Get from Facebook Business Manager
    pixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "",
  },
  yandex: {
    // Get from Yandex.Metrica account
    metricaId: process.env.NEXT_PUBLIC_YANDEX_METRICA_ID || "",
    goalId: process.env.NEXT_PUBLIC_YANDEX_GOAL_ID || "",
  },
  vk: {
    // Get from VK Ads
    pixelId: process.env.NEXT_PUBLIC_VK_PIXEL_ID || "",
  },
}

// Handler for form submission conversions
export async function handleFormConversion(formData: {
  leadTemperature: string
  formType: "application" | "order"
  leadScore?: number
  abTestVariant?: string
}) {
  // Import here to avoid circular imports
  const { RetargetingPixels } = await import("@/app/lib/retargeting")

  // Track Google Ads conversion
  if (RETARGETING_CONFIG.google.conversionId) {
    RetargetingPixels.trackGoogleConversion(
      RETARGETING_CONFIG.google.conversionId,
      RETARGETING_CONFIG.google.conversionLabel,
      formData.leadTemperature === "hot" ? 100 : formData.leadTemperature === "warm" ? 50 : 10,
    )
  }

  // Track Facebook conversion
  if (RETARGETING_CONFIG.facebook.pixelId) {
    RetargetingPixels.trackFacebookPixel("Lead", {
      value: formData.leadTemperature === "hot" ? 100 : 50,
      currency: "RUB",
      content_name: formData.formType,
      lead_temperature: formData.leadTemperature,
    })
  }

  // Track Yandex goal
  if (RETARGETING_CONFIG.yandex.metricaId && RETARGETING_CONFIG.yandex.goalId) {
    RetargetingPixels.trackYandexMetrica(RETARGETING_CONFIG.yandex.goalId, {
      form_type: formData.formType,
      lead_temperature: formData.leadTemperature,
    })
  }

  console.log("[v0] Conversion tracked across all pixels:", formData)
}
