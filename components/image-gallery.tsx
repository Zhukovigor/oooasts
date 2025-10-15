"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export function ImageGallery({ images = [], mainImage, name }: { images: string[], mainImage: string, name: string }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const allImages = [mainImage, ...(images || [])]

  // Навигация клавиатурой
  useEffect(() => {
    if (!selectedImage) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null)
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, currentIndex])

  const nextImage = () => {
    const newIndex = (currentIndex + 1) % allImages.length
    setCurrentIndex(newIndex)
    setSelectedImage(allImages[newIndex])
  }

  const prevImage = () => {
    const newIndex = (currentIndex - 1 + allImages.length) % allImages.length
    setCurrentIndex(newIndex)
    setSelectedImage(allImages[newIndex])
  }

  const openImage = (img: string, index: number) => {
    setSelectedImage(img)
    setCurrentIndex(index)
  }

  return (
    <>
      {/* Основное фото */}
      <div className="relative h-96 bg-white rounded-lg shadow-sm mb-4 cursor-pointer overflow-hidden group">
        <Image
          src={mainImage || "/placeholder.svg"}
          alt={name}
          fill
          className="object-contain p-8 transition-transform group-hover:scale-105"
          onClick={() => openImage(mainImage, 0)}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      </div>

      {/* Миниатюры */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.map((img, idx) => (
            <div
              key={idx}
              className="relative h-20 bg-white rounded border hover:border-blue-600 cursor-pointer overflow-hidden group"
              onClick={() => openImage(img, idx)}
            >
              <Image
                src={img || "/placeholder.svg"}
                alt={`${name} ${idx + 1}`}
                fill
                className="object-contain p-2 transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно увеличенного изображения */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              className="relative w-[95vw] h-[95vh] max-w-7xl max-h-[95vh]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Основное изображение */}
              <Image
                src={selectedImage}
                alt="Zoomed image"
                fill
                className="object-contain rounded-lg"
                priority
              />
              
              {/* Кнопка закрытия */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all duration-200 backdrop-blur-sm z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Навигационные кнопки */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all duration-200 backdrop-blur-sm"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Индикатор прогресса */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    {currentIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
