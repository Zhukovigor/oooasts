"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function TruckBrandsShowcase() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)

  const slides = [
    {
      id: 1,
      title: "Грандиозная распродажа грузовиков!",
      subtitle: "Узнай свою цену!",
      badge: "Осталось всего 10 авто!",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hot-Sale-Used-Komatsu-PC400-Excavator-PC50-PC40-PC30-0lvJNSAZvQNv2imZHod9A8bv7ttTDf.jpg",
      featured: true,
    },
    {
      id: 2,
      title: "Спецтехника из Китая",
      subtitle: "Выгодные условия доставки",
      badge: "Новое поступление",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250924-WA0013-KWy9wO28j8PP3TRK8Tsx5l9VTS6pcb.jpg",
      featured: false,
    },
    {
      id: 3,
      title: "Автобетононасосы по цене производителя",
      subtitle: "Быстрая доставка в любой регион",
      badge: "Скидка 15%",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SANY-Kitay_42549_4858854752-XoVov2Xx9xGrU512qtDMIS6eAcggXj.jpg",
      featured: false,
    },
  ]

  const brands = [
    { name: "Volvo", logo: "/placeholder.svg?height=60&width=60", category: "Грузовики" },
    { name: "Scania", logo: "/placeholder.svg?height=60&width=60", category: "Грузовики" },
    { name: "MAN", logo: "/placeholder.svg?height=60&width=60", category: "Грузовики" },
    { name: "DAF", logo: "/placeholder.svg?height=60&width=60", category: "Грузовики" },
    { name: "Isuzu", logo: "/placeholder.svg?height=60&width=60", category: "Грузовики" },
    { name: "Hino", logo: "/placeholder.svg?height=60&width=60", category: "Грузовики" },
    { name: "Komatsu", logo: "/placeholder.svg?height=60&width=60", category: "Спецтехника" },
    { name: "Hyundai HD", logo: "/placeholder.svg?height=60&width=60", category: "Грузовики" },
    { name: "SANY", logo: "/placeholder.svg?height=60&width=60", category: "Спецтехника" },
    { name: "Zoomlion", logo: "/placeholder.svg?height=60&width=60", category: "Спецтехника" },
    { name: "JCB", logo: "/placeholder.svg?height=60&width=60", category: "Спецтехника" },
    { name: "Caterpillar", logo: "/placeholder.svg?height=60&width=60", category: "Спецтехника" },
  ]

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  const currentSlideData = slides[currentSlide]

  return (
    null
  )
}
