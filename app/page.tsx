"use client"

import HeroSection from "../hero-section"
import { TextGradientScroll } from "@/components/ui/text-gradient-scroll"
import { Timeline } from "@/components/ui/timeline"
import "./globals.css"
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials"
import { motion } from "framer-motion"
import Chatbot from "../components/chatbot"
import CTASection from "@/components/cta-section"
import Footer from "@/components/footer"
import FAQSection from "@/components/faq-section"
import ExcavatorModels from "@/components/excavator-models"
import ApplicationForm from "@/components/application-form"
import HowWeWork from "@/components/how-we-work"
import ServiceMap from "@/components/service-map"
import TruckBrandsShowcase from "@/components/truck-brands-showcase"

export default function Page() {
  const missionStatement =
    "ООО «АСТС» – динамично развивающийся поставщик строительной спецтехники, горно-шахтного оборудования, машин и механизмов. Мы не просто продаем строительную и грузовую спецтехнику, горно-шахтное оборудование – мы предоставляем готовые решения для развития вашего бизнеса. Наша миссия – сделать приобретение надежной китайской техники максимально простым, выгодным и безопасным для вашего бизнеса."

  const timelineEntries = [
    {
      id: 1,
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hot-Sale-Used-Komatsu-PC400-Excavator-PC50-PC40-PC30-0lvJNSAZvQNv2imZHod9A8bv7ttTDf.jpg",
      alt: "Экскаватор Komatsu PC400",
      title: "Широкий выбор техники",
      description:
        "Техника со склада в РФ или под заказ из Китая под ваши конкретные задачи. Мы предлагаем как новую, так и подержанную спецтехнику высокого качества. Экскаваторы, погрузчики, бульдозеры и другое оборудование от ведущих производителей.",
      layout: "left" as const,
    },
    {
      id: 2,
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250924-WA0013-KWy9wO28j8PP3TRK8Tsx5l9VTS6pcb.jpg",
      alt: "Экскаватор Komatsu PC300",
      title: "Выгодные цены и полный сервис",
      description:
        "Оптимизированная логистика позволяет предлагать оптимальную стоимость. Полный комплекс услуг: от подбора модели и организации доставки до растаможки и полного документального сопровождения с НДС. Работаем под ключ.",
      layout: "right" as const,
    },
    {
      id: 3,
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SANY-Kitay_42549_4858854752-XoVov2Xx9xGrU512qtDMIS6eAcggXj.jpg",
      alt: "Автобетононасос SANY",
      title: "Автобетононасосы по лучшим ценам",
      description:
        "Мы находим для наших клиентов автобетононасосы SANY и Zoomlion с наилучшей ценой на рынке. Прямые поставки от производителей, модели от 31 до 62 метров, новая и б/у техника. Полное сопровождение сделки и быстрая доставка по России.",
      layout: "left" as const,
    },
    {
      id: 4,
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Zoomlion%2031%20%D0%BC%D0%B5%D1%82%D1%80-7caICdI5tnoEzRFc27BAC31ca07PwA.jpg",
      alt: "Автобетононасос Zoomlion",
      title: "Надежные автобетононасосы для вашего бизнеса",
      description:
        "Поставляем проверенные автобетононасосы с гарантией качества. Помогаем с выбором оптимальной модели под ваши задачи, организуем доставку и растаможку. Гибкие условия оплаты, возможность лизинга. Работаем с ведущими производителями SANY и Zoomlion.",
      layout: "right" as const,
    },
    {
      id: 5,
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250928-WA0007-SP2bEOhxUA4q43KyjUxSnmH5q42Ot6.jpg",
      alt: "Экскаватор Komatsu PC200",
      title: "Профессионализм и надежность",
      description:
        "Индивидуальный подход к каждому клиенту, гибкие условия сотрудничества и прозрачность на всех этапах сделки. Слаженная работа команды для быстрого выполнения ваших заказов. Мы нацелены на долгосрочное партнерство и помогаем нашим клиентам достигать успеха.",
      layout: "left" as const,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Truck Brands Showcase Section */}
      <TruckBrandsShowcase />

      {/* Mission Statement Section with Grid Background */}
      

      <ExcavatorModels />

      {/* Timeline Section */}
      <section id="community" className="relative py-20 bg-white">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

        <div className="relative z-10">
          <div className="container mx-auto px-6 mb-16">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-black tracking-wider mb-6 text-gray-900">НАШИ ПРЕИМУЩЕСТВА</h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
                Мы гордимся тем, что обеспечиваем техникой ключевые отрасли промышленности
              </p>
            </div>
          </div>

          <Timeline entries={timelineEntries} />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-20 bg-white">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-wider text-gray-900 mb-6">
              Отзывы наших{" "}
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">КЛИЕНТОВ</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
              Реальные истории от компаний, которые доверяют нам поставку спецтехники
            </p>
          </motion.div>

          <StaggerTestimonials />
        </div>
      </section>

      <FAQSection />

      <ApplicationForm />

      <HowWeWork />

      <ServiceMap />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />

      {/* Chatbot */}
      <Chatbot />
    </div>
  )
}
