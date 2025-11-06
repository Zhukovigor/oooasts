import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle, Gauge, Wrench, Fuel, Weight, Ruler } from "lucide-react"
import Breadcrumb from "@/components/breadcrumb"
import ApplicationForm from "@/components/application-form"

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
    images: ["/images/design-mode/IMG-20250928-WA0007.jpg"],
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

  const features = [
    {
      title: "Экономичность",
      description: "Расход топлива всего 12-15 л/час благодаря системе KOMTRAX"
    },
    {
      title: "Надежность",
      description: "Средний ресурс до капитального ремонта - 15 000 моточасов"
    },
    {
      title: "Комфорт",
      description: "Эргономичная кабина с климат-контролем и низким уровнем шума"
    },
    {
      title: "Технологичность",
      description: "Цифровая панель управления и система мониторинга состояния"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumb
        items={[
          { label: "Главная", href: "/" },
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
                  href="#application"
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
                alt="Экскаватор Komatsu PC200 - универсальная строительная техника для земляных работ"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Specifications */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">19-21 т</div>
              <div className="text-sm text-gray-600">Вес</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">148 л.с.</div>
              <div className="text-sm text-gray-600">Мощность</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">0.8-1.0 м³</div>
              <div className="text-sm text-gray-600">Ковш</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">6.5 м</div>
              <div className="text-sm text-gray-600">Глубина</div>
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
              <div key={index} className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                <spec.icon className="w-10 h-10 text-gray-900 mb-4" />
                <div className="text-sm text-gray-600 mb-1">{spec.label}</div>
                <div className="text-2xl font-bold text-gray-900">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-12 text-gray-900 text-center">
            ОСНОВНЫЕ ПРЕИМУЩЕСТВА
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 bg-white">
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-12 text-gray-900 text-center">
              ОБЛАСТИ ПРИМЕНЕНИЯ
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {applications.map((application, index) => (
                <div key={index} className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm">
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-8 text-gray-900 text-center">
              СКОЛЬКО СТОИТ KOMATSU PC200?
            </h2>

            <div className="bg-gray-50 p-8 rounded-lg shadow-sm mb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Новый экскаватор</h3>
                  <div className="text-4xl font-black text-gray-900 mb-4">от 10 млн ₽</div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Заводская гарантия 2 года
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Максимальный ресурс
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Современные технологии
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Полная комплектация
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Б/у экскаватор</h3>
                  <div className="text-4xl font-black text-gray-900 mb-4">от 7 млн ₽</div>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Проверенная техника
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Экономия до 60%
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Быстрая окупаемость
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Гарантия на основные узлы
                    </li>
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
                href="#application"
                className="inline-block px-8 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors text-lg"
              >
                ПОЛУЧИТЬ ТОЧНУЮ ЦЕНУ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-8 text-gray-900">
              ДОСТАВКА И ГАРАНТИЯ
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">🚚 Доставка</h3>
                <p className="text-gray-600">Доставка по всей России от 14 дней. Железнодорожный или автомобильный транспорт.</p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">🛡️ Гарантия</h3>
                <p className="text-gray-600">Гарантия до 2 лет на новую технику и 6 месяцев на б/у. Сервисное обслуживание.</p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">📋 Документы</h3>
                <p className="text-gray-600">Полный пакет документов для постановки на учет. Помощь с растаможкой.</p>
              </div>
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
                href="#application"
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

      {/* Application Form Section */}
      <section id="application" className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white mb-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-4">
              УЗНАЙТЕ АКТУАЛЬНУЮ ЦЕНУ
            </h2>
            <p className="text-xl text-gray-300">
              Оставьте заявку и получите коммерческое предложение на Komatsu PC200 с учетом доставки до вашего города
            </p>
          </div>
          <ApplicationForm />
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Экскаватор Komatsu PC200",
            description: "Универсальный гусеничный экскаватор для строительных и земляных работ",
            image: "/images/design-mode/IMG-20250928-WA0007.jpg",
            brand: {
              "@type": "Brand",
              name: "Komatsu",
            },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "RUB",
              lowPrice: "7000000",
              highPrice: "10000000",
              offerCount: "2",
              availability: "https://schema.org/InStock",
              seller: {
                "@type": "Organization",
                name: "ООО АСТС",
                url: "https://asts.ru"
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
