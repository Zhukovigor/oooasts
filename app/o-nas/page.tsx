import type { Metadata } from "next"
import AboutClient from "./client"

export const metadata: Metadata = {
  title: "О нас - ООО АСТС | Поставка спецтехники из Китая",
  description:
    "ООО АСТС - надежный поставщик спецтехники из Китая с многолетним опытом. Экскаваторы Komatsu, автобетононасосы SANY и Zoomlion. Полный цикл поставки с гарантией качества. Работаем с 2015 года, более 500 довольных клиентов.",
  keywords: [
    "о компании АСТС",
    "поставка спецтехники из Китая",
    "экскаваторы Komatsu",
    "автобетононасосы",
    "надежный поставщик",
    "ООО АСТС",
    "спецтехника из китая",
  ],
  openGraph: {
    title: "О нас - ООО АСТС",
    description: "Надежный поставщик спецтехники из Китая с многолетним опытом",
    type: "website",
  },
}

export default function AboutPage() {
  return <AboutClient />
}
