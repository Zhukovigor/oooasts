import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle, Gauge, Wrench, Fuel, Weight, Ruler } from "lucide-react"
import Breadcrumb from "@/components/breadcrumb"

export const metadata: Metadata = {
  title: "Купить экскаватор Komatsu PC200 из Китая | Цена, характеристики | ООО АСТС",
  description:
    "Экскаватор Komatsu PC200 - универсальная спецтехника для строительства и земляных работ. Купить новый и б/у PC200 из Китая с доставкой по России. Полные характеристики, цены, фото. Вес 19.9-21.1 т, мощность 110 кВт, ковш 0.8-1.0 м³.",
  keywords: [
    "komatsu pc200",
    "экскаватор komatsu pc200",
    "купить komatsu pc200",
    "komatsu pc200 цена",
    "komatsu pc200 характеристики",
    "экскаватор pc200 бу",
    "komatsu pc200 стоимость",
    "komatsu pc200 из китая",
    "komatsu pc200 москва",
    "komatsu pc200 технические характеристики",
  ],
  openGraph: {
    title: "Купить экскаватор Komatsu PC200 | ООО АСТС",
    description: "Универсальный гусеничный экскаватор для строительных и земляных работ",
    type: "website",
  },
}

export default function KomatsuPC200Page() {
  const specifications = [
    { icon: Weight, label: "Рабочий вес", value: "19 900 - 21 100 кг" },
    { icon: Gauge, label: "Мощность двигателя", value: "110 кВт (148 л.с.)" },
    { icon: Fuel, label: "Объем ковша", value: "0.8 - 1.0 м³" },
    { icon: Ruler, label: "Глубина копания", value: "6 530 мм" },
    { icon: Ruler, label: "Радиус копания", value: "9 750 мм" },
    { icon: Wrench, label: "Усилие копания", value: "134 кН" },
  ]

  const advantages = [
    "Надежный двигатель Komatsu с низким расходом топлива",
    "Просторная и комфортная кабина с отличной обзорностью",
    "Гидравлическая система с высокой производительностью",
    "Простое и удобное управление",
    "Низкие эксплуатационные расходы",
    "Широкий выбор навесного оборудования",
    "Долгий срок службы и высокая остаточная стоимость",
    "Отличная маневренность на стройплощадке",
  ]

  const applications = [
    "Земляные работы и рытье котлованов",
    "Строительство дорог и инфраструктуры",
    "Разработка карьеров и добыча полезных ископаемых",
    "Погрузочно-разгрузочные работы",
    "Демонтаж зданий и сооружений",
    "Благоустройство территорий",
    "Прокладка коммуникаций",
    "Сельскохозяйственные работы",
  ]

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb
        items={[
          { label: "Техника", href: "/komatsu" },
          { label: "Каталог Komatsu", href: "/komatsu" },
          { label: "Komatsu PC200", href: "/komatsu-pc200" },
        ]}
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-7xl font-black tracking-wider mb-6">KOMATSU PC200</h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
                Универсальный гусеничный экскаватор для любых строительных и земляных работ. Оптимальное сочетание
                мощности, производительности и экономичности.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/#application"
                  className="px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  УЗНАТЬ ЦЕНУ
                </Link>
                <Link
                  href="/buy-excavators"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-gray-900 transition-colors"
                >
                  КАК КУПИТЬ
                </Link>
              </div>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="/images/design-mode/IMG-20250928-WA0007.jpg"
                alt="Экскаватор Komatsu PC200"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-4 text-gray-900">
              ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ
            </h2>
            <p className="text-xl text-gray-600">Komatsu PC200-8</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {specifications.map((spec, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <spec.icon className="w-10 h-10 text-gray-900 mb-4" />
                <div className="text-sm text-gray-600 mb-1">{spec.label}</div>
                <div className="text-2xl font-bold text-gray-900">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-12 text-gray-900 text-center">
              ПРЕИМУЩЕСТВА KOMATSU PC200
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {advantages.map((advantage, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <p className="text-lg text-gray-700">{advantage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Applications Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-12 text-gray-900 text-center">
              ОБЛАСТИ ПРИМЕНЕНИЯ
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {applications.map((application, index) => (
                <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg">
                  <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    {index + 1}
                  </div>
                  <p className="text-lg text-gray-700">{application}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Price Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-8 text-gray-900 text-center">
              СКОЛЬКО СТОИТ KOMATSU PC200?
            </h2>

            <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Новый экскаватор</h3>
                  <div className="text-4xl font-black text-gray-900 mb-4">от 10 млн ₽</div>
                  <ul className="space-y-2 text-gray-600">
                    <li>✓ Заводская гарантия</li>
                    <li>✓ Максимальный ресурс</li>
                    <li>✓ Современные технологии</li>
                    <li>✓ Полная комплектация</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Б/у экскаватор</h3>
                  <div className="text-4xl font-black text-gray-900 mb-4">от 7 млн ₽</div>
                  <ul className="space-y-2 text-gray-600">
                    <li>✓ Проверенная техника</li>
                    <li>✓ Экономия до 60%</li>
                    <li>✓ Быстрая окупаемость</li>
                    <li>✓ Гарантия на основные узлы</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-lg mb-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong>Важно:</strong> Итоговая стоимость зависит от года выпуска, состояния техники, комплектации и
                курса валют. Для точного расчета с учетом доставки и растаможки оставьте заявку - наши специалисты
                подготовят индивидуальное коммерческое предложение.
              </p>
            </div>

            <div className="text-center">
              <Link
                href="/#application"
                className="inline-block px-8 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors text-lg"
              >
                ПОЛУЧИТЬ ТОЧНУЮ ЦЕНУ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Buy From Us Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-8 text-gray-900">
              ПОЧЕМУ ПОКУПАЮТ У НАС?
            </h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              ООО АСТС - надежный поставщик спецтехники из Китая с многолетним опытом. Мы предлагаем выгодные цены,
              полное документальное сопровождение и гарантию качества на каждую единицу техники.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/#application"
                className="px-8 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
              >
                ОСТАВИТЬ ЗАЯВКУ
              </Link>
              <Link
                href="/komatsu"
                className="px-8 py-4 bg-transparent border-2 border-gray-900 text-gray-900 font-bold rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
              >
                ДРУГИЕ МОДЕЛИ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Экскаватор Komatsu PC200",
            description:
              "Универсальный гусеничный экскаватор для строительных и земляных работ. Вес 19.9-21.1 т, мощность 110 кВт (148 л.с.), объем ковша 0.8-1.0 м³",
            brand: {
              "@type": "Brand",
              name: "Komatsu",
            },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "RUB",
              lowPrice: "7000000",
              highPrice: "10000000",
              offerCount: "5",
              availability: "https://schema.org/InStock",
              seller: {
                "@type": "Organization",
                name: "ООО АСТС",
              },
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              reviewCount: "127",
            },
            additionalProperty: [
              {
                "@type": "PropertyValue",
                name: "Рабочий вес",
                value: "19900-21100 кг",
              },
              {
                "@type": "PropertyValue",
                name: "Мощность двигателя",
                value: "110 кВт (148 л.с.)",
              },
              {
                "@type": "PropertyValue",
                name: "Объем ковша",
                value: "0.8-1.0 м³",
              },
            ],
          }),
        }}
      />
    </div>
  )
}
