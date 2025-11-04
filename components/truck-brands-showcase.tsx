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
    <section className="relative py-20 bg-gray-50 overflow-hidden">
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

      {/* Hero Carousel */}
      <div className="relative h-[600px] mb-20 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 transition-all duration-1000 bg-cover bg-center"
          style={{ backgroundImage: `url('${currentSlideData.image}')` }}
        >
          <div className="absolute inset-0 bg-gray-900/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center container mx-auto px-6">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="inline-block bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm mb-6">
              {currentSlideData.badge}
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">{currentSlideData.title}</h2>

            <p className="text-xl md:text-2xl text-gray-100 mb-10">{currentSlideData.subtitle}</p>

            <Link href="#brands">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6">
                Смотреть каталог
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full transition-all"
          aria-label="Предыдущий слайд"
        >
          <ChevronLeft size={28} />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full transition-all"
          aria-label="Следующий слайд"
        >
          <ChevronRight size={28} />
        </button>

        {/* Dot Navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentSlide === index ? "bg-red-600 w-8" : "bg-white/60 hover:bg-white"
              }`}
              aria-label={`Слайд ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Brands Section */}
      
    </section>
  )
}
