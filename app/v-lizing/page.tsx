import type { Metadata } from "next"
import LeasingPageClient from "./client"
import Footer from "@/components/footer"
import HeroSection from "@/hero-section"

export const metadata: Metadata = {
  title: "Лизинг спецтехники Komatsu | ООО АСТС - Выгодные условия",
  description:
    "Лизинг экскаваторов Komatsu PC200, PC300, PC400 на выгодных условиях. Калькулятор лизинга онлайн, быстрое оформление, минимальный первоначальный взнос от 10%. Доставка спецтехники из Китая. Одобрение за 1 день.",
  keywords: [
    "лизинг экскаватора",
    "лизинг спецтехники",
    "Komatsu в лизинг",
    "лизинг строительной техники",
    "калькулятор лизинга",
    "лизинг без первоначального взноса",
    "лизинг экскаватора москва",
    "оформить лизинг спецтехники",
  ],
  openGraph: {
    title: "Лизинг спецтехники Komatsu | ООО АСТС",
    description: "Выгодные условия лизинга экскаваторов Komatsu. Калькулятор расчета платежей онлайн.",
    type: "website",
  },
}

export default function LeasingPage() {
  return (
    <>
      <HeroSection />
      <LeasingPageClient />
      <Footer />
    </>
  )
}
