import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import Breadcrumb from "@/components/breadcrumb"

export const metadata: Metadata = {
  title: "Каталог экскаваторов Komatsu | Купить PC200, PC300, PC400 из Китая | ООО АСТС",
  description:
    "Полный каталог экскаваторов Komatsu: PC200, PC300, PC400 и другие модели. Новые и б/у экскаваторы из Китая с доставкой по России. Характеристики, цены, фото. Гарантия качества и полное документальное сопровождение.",
  keywords: [
    "каталог экскаваторов komatsu",
    "komatsu pc200",
    "komatsu pc300",
    "komatsu pc400",
    "купить экскаватор komatsu",
    "экскаваторы из китая",
    "komatsu цена",
    "komatsu характеристики",
  ],
  openGraph: {
    title: "Каталог экскаваторов Komatsu | ООО АСТС",
    description: "Полный ассортимент экскаваторов Komatsu от компактных до сверхтяжелых моделей",
    type: "website",
  },
}

export default function KomatsuCatalogPage() {
  const models = [
    {
      name: "Komatsu PC200",
      description: "Универсальный экскаватор среднего класса",
      weight: "19.9 - 21.1 т",
      power: "110 кВт (148 л.с.)",
      bucket: "0.8 - 1.0 м³",
      priceNew: "от 8 млн ₽",
      priceUsed: "от 3 млн ₽",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250928-WA0007-SP2bEOhxUA4q43KyjUxSnmH5q42Ot6.jpg",
      link: "/komatsu-pc200",
      popular: true,
    },
    {
      name: "Komatsu PC300",
      description: "Мощный экскаватор для сложных работ",
      weight: "28.5 - 31.5 т",
      power: "165 кВт (220 л.с.)",
      bucket: "1.2 - 1.6 м³",
      priceNew: "от 12 млн ₽",
      priceUsed: "от 5 млн ₽",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250924-WA0013-KWy9wO28j8PP3TRK8Tsx5l9VTS6pcb.jpg",
      link: "/#application",
      popular: true,
    },
    {
      name: "Komatsu PC400",
      description: "Тяжелый экскаватор для крупных проектов",
      weight: "38.5 - 42.5 т",
      power: "200 кВт (268 л.с.)",
      bucket: "1.6 - 2.2 м³",
      priceNew: "от 18 млн ₽",
      priceUsed: "от 8 млн ₽",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hot-Sale-Used-Komatsu-PC400-Excavator-PC50-PC40-PC30-0lvJNSAZvQNv2imZHod9A8bv7ttTDf.jpg",
      link: "/#application",
      popular: true,
    },
    {
      name: "Komatsu PC130",
      description: "Компактный экскаватор для ограниченных пространств",
      weight: "12.5 - 13.5 т",
      power: "67 кВт (90 л.с.)",
      bucket: "0.4 - 0.6 м³",
      priceNew: "от 5 млн ₽",
      priceUsed: "от 2 млн ₽",
      image: "/placeholder.svg?height=400&width=600",
      link: "/#application",
      popular: false,
    },
    {
      name: "Komatsu PC500",
      description: "Сверхтяжелый экскаватор для карьеров",
      weight: "48.5 - 52.5 т",
      power: "250 кВт (335 л.с.)",
      bucket: "2.0 - 2.8 м³",
      priceNew: "от 25 млн ₽",
      priceUsed: "от 12 млн ₽",
      image: "/placeholder.svg?height=400&width=600",
      link: "/#application",
      popular: false,
    },
    {
      name: "Komatsu PC220",
      description: "Улучшенная версия PC200 с большей мощностью",
      weight: "21.5 - 23.0 т",
      power: "123 кВт (165 л.с.)",
      bucket: "0.9 - 1.1 м³",
      priceNew: "от 9 млн ₽",
      priceUsed: "от 4 млн ₽",
      image: "/placeholder.svg?height=400&width=600",
      link: "/#application",
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb
        items={[
          { label: "Техника", href: "/komatsu" },
          { label: "Каталог Komatsu", href: "/komatsu" },
        ]}
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-wider mb-6">КАТАЛОГ ЭКСКАВАТОРОВ KOMATSU</h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Полный ассортимент экскаваторов Komatsu от компактных до сверхтяжелых моделей. Новая и б/у техника из
              Китая с доставкой по России.
            </p>
          </div>
        </div>
      </section>

      {/* Popular Models Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-4 text-gray-900">ПОПУЛЯРНЫЕ МОДЕЛИ</h2>
            <p className="text-xl text-gray-600">Самые востребованные экскаваторы Komatsu</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {models
              .filter((model) => model.popular)
              .map((model, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-900 rounded-lg overflow-hidden hover:shadow-2xl transition-shadow"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <Image src={model.image || "/placeholder.svg"} alt={model.name} fill className="object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-black text-gray-900 mb-2">{model.name}</h3>
                    <p className="text-gray-600 mb-4">{model.description}</p>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Вес:</span>
                        <span className="font-semibold text-gray-900">{model.weight}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Мощность:</span>
                        <span className="font-semibold text-gray-900">{model.power}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ковш:</span>
                        <span className="font-semibold text-gray-900">{model.bucket}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Новый:</span>
                        <span className="text-lg font-bold text-gray-900">{model.priceNew}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Б/у:</span>
                        <span className="text-lg font-bold text-gray-900">{model.priceUsed}</span>
                      </div>
                    </div>

                    <Link
                      href={model.link}
                      className="block w-full py-3 bg-gray-900 text-white text-center font-bold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      {model.link === "/#join" || model.link === "/#application" ? "УЗНАТЬ ЦЕНУ" : "ПОДРОБНЕЕ"}
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* All Models Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-4 text-gray-900">ВСЕ МОДЕЛИ</h2>
            <p className="text-xl text-gray-600">Полный ассортимент экскаваторов Komatsu</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {models
              .filter((model) => !model.popular)
              .map((model, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <Image src={model.image || "/placeholder.svg"} alt={model.name} fill className="object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-black text-gray-900 mb-2">{model.name}</h3>
                    <p className="text-gray-600 mb-4">{model.description}</p>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Вес:</span>
                        <span className="font-semibold text-gray-900">{model.weight}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Мощность:</span>
                        <span className="font-semibold text-gray-900">{model.power}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ковш:</span>
                        <span className="font-semibold text-gray-900">{model.bucket}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Новый:</span>
                        <span className="text-lg font-bold text-gray-900">{model.priceNew}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Б/у:</span>
                        <span className="text-lg font-bold text-gray-900">{model.priceUsed}</span>
                      </div>
                    </div>

                    <Link
                      href={model.link}
                      className="block w-full py-3 bg-gray-900 text-white text-center font-bold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      УЗНАТЬ ЦЕНУ
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-6">НЕ НАШЛИ НУЖНУЮ МОДЕЛЬ?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Мы поставляем любые модели экскаваторов Komatsu под заказ. Оставьте заявку, и мы подберем технику под ваши
            задачи.
          </p>
          <Link
            href="/#application"
            className="inline-block px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            ОСТАВИТЬ ЗАЯВКУ
          </Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Каталог экскаваторов Komatsu",
            description: "Полный каталог экскаваторов Komatsu различных моделей",
            itemListElement: models.map((model, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Product",
                name: model.name,
                description: model.description,
                brand: {
                  "@type": "Brand",
                  name: "Komatsu",
                },
                offers: {
                  "@type": "AggregateOffer",
                  priceCurrency: "RUB",
                  lowPrice: model.priceUsed.replace(/[^\d]/g, ""),
                  highPrice: model.priceNew.replace(/[^\d]/g, ""),
                },
              },
            })),
          }),
        }}
      />
    </div>
  )
}
