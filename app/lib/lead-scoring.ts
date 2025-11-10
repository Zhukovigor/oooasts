export interface LeadScoringResult {
  totalScore: number
  temperature: "cold" | "warm" | "hot"
  breakdown: {
    sourceScore: number
    contactQualityScore: number
    messageQualityScore: number
    responsePotentialScore: number
  }
}

export function calculateLeadScore(data: {
  source?: string
  hasEmail?: boolean
  hasPhone?: boolean
  comment?: string
  modelName?: string
  customerName?: string
}): LeadScoringResult {
  let totalScore = 0
  const breakdown = {
    sourceScore: 0,
    contactQualityScore: 0,
    messageQualityScore: 0,
    responsePotentialScore: 0,
  }

  // 1. Source Score (0-25 points)
  // Model-specific order = hot lead
  if (data.modelName && data.modelName !== "Unknown") {
    breakdown.sourceScore = 25 // Came from specific product = high intent
  } else {
    breakdown.sourceScore = 10 // General inquiry
  }

  // 2. Contact Quality Score (0-30 points)
  if (data.hasEmail && data.hasPhone) {
    breakdown.contactQualityScore = 30 // Both = most engaged
  } else if (data.hasEmail || data.hasPhone) {
    breakdown.contactQualityScore = 20 // One contact method
  } else {
    breakdown.contactQualityScore = 5 // No email/phone
  }

  // 3. Message Quality Score (0-25 points)
  if (data.comment && data.comment.trim().length > 50) {
    breakdown.messageQualityScore = 25 // Detailed inquiry
  } else if (data.comment && data.comment.trim().length > 10) {
    breakdown.messageQualityScore = 15 // Some comment
  } else {
    breakdown.messageQualityScore = 5 // Minimal info
  }

  // 4. Response Potential Score (0-20 points)
  // Check if name looks legitimate (not spam)
  const nameLength = data.customerName?.trim().length || 0
  if (nameLength > 3 && nameLength < 50) {
    breakdown.responsePotentialScore = 20
  } else {
    breakdown.responsePotentialScore = 5
  }

  totalScore =
    breakdown.sourceScore +
    breakdown.contactQualityScore +
    breakdown.messageQualityScore +
    breakdown.responsePotentialScore

  // Determine temperature based on total score
  let temperature: "cold" | "warm" | "hot"
  if (totalScore >= 75) {
    temperature = "hot"
  } else if (totalScore >= 50) {
    temperature = "warm"
  } else {
    temperature = "cold"
  }

  return {
    totalScore,
    temperature,
    breakdown,
  }
}
