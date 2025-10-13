"use client"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle, Truck, FileText, Shield, Clock, DollarSign } from "lucide-react"

export default function BuyExcavatorsClient() {
  const advantages = [
    {
      icon: DollarSign,
      title: "Выгодные цены",
      description: "Прямые поставки из Китая без посредников. Экономия до 30% от рыночной цены.",
    },
    {
      icon: Shield,
      title: "Гарантия качества",
      description: "Тщательная проверка каждой единицы техники. Гарантия на новую технику от производителя.",
    },
    {
      icon: FileText,
      title: "Полное оформление",
      description: "Берем на себя все вопросы документального оформления, растаможки и сертификации.",
    },
    {
      icon: Truck,
      title: "Доставка по РФ",
      description: "Организуем доставку спецтехники в любой регион России. Контроль на каждом этапе.",
    },
    {
      icon: Clock,
      title: "Быстрые сроки",
      description: "Техника в наличии на складе - доставка 1-2 недели. Заказ из Китая - 20-45 дней.",
    },
    {
      icon: CheckCircle,
      title: "Лизинг и рассрочка",
      description: "Работаем с ведущими лизинговыми компаниями. Первоначальный взнос от 10%.",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Консультация",
      description:
        "Свяжитесь с нами любым удобным способом. Наши специалисты помогут подобрать технику под ваши задачи.",
    },
    {
      number: "02",
      title: "Подбор техники",
      description: "Предложим несколько вариантов с фото, видео и техническими характеристиками.",
    },
    {
      number: "03",
      title: "Договор и оплата",
      description: "Заключаем официальный договор. Гибкие условия оплаты, возможность лизинга.",
    },
    {
      number: "04",
      title: "Доставка",
      description: "Организуем доставку, растаможку и оформление всех документов. Информируем на каждом этапе.",
    },
    {
      number: "05",
      title: "Передача техники",
      description: "Передаем технику с полным пакетом документов. Консультируем по эксплуатации.",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-wider mb-6">КУПИТЬ ЭКСКАВАТОР ИЗ КИТАЯ</h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Прямые поставки новых и б/у экскаваторов Komatsu. Полное документальное сопровождение, выгодные цены,
              доставка по всей России.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/#application"
                className="px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                ОСТАВИТЬ ЗАЯВКУ
              </Link>
              <Link
                href="/komatsu"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-gray-900 transition-colors"
              >
                КАТАЛОГ ТЕХНИКИ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-4 text-gray-900">
              ПРЕИМУЩЕСТВА РАБОТЫ С НАМИ
            </h2>
            <p className="text-xl text-gray-600">Почему выбирают ООО АСТС</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {advantages.map((advantage, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <advantage.icon className="w-12 h-12 text-gray-900 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{advantage.title}</h3>
                <p className="text-gray-600 leading-relaxed">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Buy Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-4 text-gray-900">КАК КУПИТЬ ЭКСКАВАТОР</h2>
            <p className="text-xl text-gray-600">Простой процесс покупки в 5 шагов</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-900 text-white rounded-lg flex items-center justify-center text-2xl font-black">
                  {step.number}
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Models Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-4 text-gray-900">ПОПУЛЯРНЫЕ МОДЕЛИ</h2>
            <p className="text-xl text-gray-600">Экскаваторы Komatsu в наличии и под заказ</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Link href="/komatsu-pc200" className="group">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src="/images/design-mode/IMG-20250928-WA0007.jpg"
                    alt="Komatsu PC200"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Komatsu PC200</h3>
                  <p className="text-gray-600 mb-4">Универсальный экскаватор для любых задач</p>
                  <span className="text-gray-900 font-bold group-hover:underline">Подробнее →</span>
                </div>
              </div>
            </Link>

            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src="/images/design-mode/IMG-20250924-WA0013.jpg"
                  alt="Komatsu PC300"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Komatsu PC300</h3>
                <p className="text-gray-600 mb-4">Мощный экскаватор для сложных работ</p>
                <Link href="/#application" className="text-gray-900 font-bold hover:underline">
                  Узнать цену →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src="/images/design-mode/Hot-Sale-Used-Komatsu-PC400-Excavator-PC50-PC40-PC30.jpg"
                  alt="Komatsu PC400"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Komatsu PC400</h3>
                <p className="text-gray-600 mb-4">Тяжелый экскаватор для крупных проектов</p>
                <Link href="/#application" className="text-gray-900 font-bold hover:underline">
                  Узнать цену →
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/komatsu"
              className="inline-block px-8 py-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
            >
              СМОТРЕТЬ ВСЕ МОДЕЛИ
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-6">ГОТОВЫ КУПИТЬ ЭКСКАВАТОР?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Оставьте заявку, и наши специалисты свяжутся с вами в течение 15 минут для консультации
          </p>
          <Link
            href="/#application"
            className="inline-block px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            ОСТАВИТЬ ЗАЯВКУ
          </Link>
        </div>
      </section>
    </div>
  )
}
