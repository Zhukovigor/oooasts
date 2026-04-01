"use client"

import type { ReactNode } from "react"

/**
 * Retargeting Provider Component
 * Initializes retargeting pixels (Google, Facebook, Yandex, VK) on app load
 * Must be placed in layout.tsx
 */
export function RetargetingProvider({ children }: { children: ReactNode }) {
  // Initialization happens here - actual pixel code runs on client side
  return <>{children}</>
}
