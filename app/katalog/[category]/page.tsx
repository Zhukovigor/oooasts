"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { OrderModal } from "@/components/order-modal"
import Footer from "@/components/footer"

interface ClientModelPageProps {
  category: any
  model: any
  params: { category: string; model: string }
}

export default function ClientModelPage({ category, model, params }: ClientModelPageProps) {
  const [openSections, setOpenSections] = useState({
    specifications: true,
    description: false
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Безопасная обработка images
  const images = Array.isArray(model.images) ? model.images : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">
              Главная
            </Link>
            <span>/</span>
            <Link href="/katalog" className="hover:text-blue-600">
              Каталог
            </Link>
            <span>/</span>
            <Link href={`/katalog/${params.category}`} className="hover:text-blue-600">
              {category?.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{model?.name}</span>
          </div>
        </div>
      </div>

      {/* Model Details */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div>
            <div className="relative h-96 bg-white rounded-lg shadow-sm mb-4">
              {model?.main_image && (
                <Image
                  src={model.main_image || "/placeholder.svg"}
                  alt={model.name || "Изображение товара"}
                  fill
                  className="object-contain p-8"
                  priority
                />
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img: string, idx: number) => (
                  <div key={idx} className="relative h-20 bg-white rounded border hover:border-blue-600 cursor-pointer">
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`${model?.name} ${idx + 1}`}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{model?.name}</h1>

            {/* Key Specs */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              {model?.working_weight && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Рабочий вес</span>
                  <span className="font-bold text-gray-900">{model.working_weight} кг</span>
                </div>
              )}
              {model?.bucket_volume && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Объем ковша</span>
                  <span className="font-bold text-gray-900">{model.bucket_volume} м³</span>
                </div>
              )}
              {model?.max_digging_depth && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Макс. глубина копания</span>
                  <span className="font-bold text-gray-900">{model.max_digging_depth} м</span>
                </div>
              )}
              {model?.engine_manufacturer && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Производитель двигателя</span>
                  <span className="font-bold text-gray-900">{model.engine_manufacturer}</span>
                </div>
              )}
              {model?.engine_power && (
                <div className="flex justify-between py-3">
                  <span className="text-gray-600">Мощность</span>
                  <span className="font-bold text-gray-900">{model.engine_power} кВт</span>
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-gray-900 mb-4">Цена по запросу</div>
              <OrderModal model={model} />
            </div>
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          {/* Specifications Accordion */}
          {model?.specifications && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('specifications')}
              >
                <h2 className="text-2xl font-bold text-gray-900">Характеристики</h2>
                <svg
                  className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
                    openSections.specifications ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openSections.specifications ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 py-6 border-t">
                  <div className="grid md:grid-cols-2 gap-8">
                    {Object.entries(model.specifications as Record<string, Record<string, string>>).map(([specCategory, specs]) => (
                      <div key={specCategory} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">{specCategory}</h3>
                        <div className="space-y-3">
                          {Object.entries(specs).map(([key, value]) => (
                            <div key={key} className="flex justify-between py-2 border-b">
                              <span className="text-gray-600">{key}</span>
                              <span className="font-medium text-gray-900">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description Accordion */}
          {model?.description && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => toggleSection('description')}
              >
                <h2 className="text-2xl font-bold text-gray-900">О товаре</h2>
                <svg
                  className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
                    openSections.description ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openSections.description ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 py-6 border-t">
                  <p className="text-gray-700 leading-relaxed">{model.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
