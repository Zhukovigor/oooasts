"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ExcavatorModels() {
  const models = [
    {
      name: "Komatsu PC200",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250928-WA0007-SP2bEOhxUA4q43KyjUxSnmH5q42Ot6.jpg",
      specs: {
        power: "110 кВт",
        weight: "20 тонн",
        depth: "6,3 м",
      },
      features: [
        "Высокая производительность",
        "Экономичный расход топлива",
        "Простота обслуживания",
        "Доступные запчасти",
      ],
    },
    {
      name: "Komatsu PC300",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250924-WA0013-KWy9wO28j8PP3TRK8Tsx5l9VTS6pcb.jpg",
      specs: {
        power: "155 кВт",
        weight: "30 тонн",
        depth: "7,2 м",
      },
      features: ["Увеличенная мощность", "Надежная конструкция", "Комфортная кабина", "Современная гидравлика"],
    },
    {
      name: "Komatsu PC400",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hot-Sale-Used-Komatsu-PC400-Excavator-PC50-PC40-PC30-0lvJNSAZvQNv2imZHod9A8bv7ttTDf.jpg",
      specs: {
        power: "200 кВт",
        weight: "40 тонн",
        depth: "7,8 м",
      },
      features: [
        "Максимальная производительность",
        "Тяжелые условия работы",
        "Долговечность",
        "Высокая грузоподъемность",
      ],
    },
  ]

  return (
    <section id="models" className="relative py-20 bg-gray-50">
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

      
    </section>
  )
}
