"use client"

import { motion } from "framer-motion"
import { MapPin, Users, Award, TrendingUp, Shield, CheckCircle2, Phone, Mail, Package } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import HeroSection from "@/hero-section"
import Footer from "@/components/footer"

export default function AboutClient() {
  const services = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Прямые поставки из Китая",
      description:
        "Работаем напрямую с заводами-производителями спецтехники в Китае. Минимизируем время на доставку и прохождение таможенных процедур. Осуществляем контроль на всех этапах поставки.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Работа с производителями",
      description:
        "Взаимодействуем с фабриками и официальными дилерами. Помогаем найти оптимального поставщика. Производим аудит и проверку выбранного производителя. Организуем оплату за технику.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Таможенное оформление",
      description:
        "Самостоятельно декларируем и производим таможенную очистку. Работаем только в правовом поле, с соблюдением законодательства РФ и Китая. Вся техника имеет необходимые сертификаты и документы.",
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Контроль качества",
      description:
        "Проверяем качество спецтехники еще до отправки в Россию. Несем полную ответственность за сохранность техники с момента получения в Китае до передачи клиенту. Оперативно устраняем возникшие замечания.",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Комплексное обслуживание",
      description:
        "Предоставляем полный цикл услуг по логистике и доставке спецтехники. Поможем наладить диалог с поставщиками в Китае. Ваш персональный менеджер всегда на связи и готов обсудить индивидуальные условия.",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Гарантия сроков",
      description:
        "Мы всегда выполняем все условия договора. Даже при возникновении непредвиденных обстоятельств все дополнительные расходы мы берем на себя. Гарантируем сроки доставки и сохранность техники.",
    },
  ]

  const statistics = [
    {
      value: "2025",
      label: "Год основания компании",
      description:
        "За это время мы проработали оптимальные логистические маршруты, которые позволяют экономить нашим клиентам время и деньги",
    },
    {
      value: "10+",
      label: "Единиц спецтехники поставлено",
      description: "Экскаваторы, автобетононасосы, бульдозеры и другая строительная техника",
    },
    {
      value: "100%",
      label: "Таможенная очистка",
      description:
        "Вся техника проходит таможенную очистку и имеет все необходимые сертификаты соответствия и декларации",
    },
    {
      value: "95%",
      label: "Доставка в срок",
      description: "Техники доставляем в заявленные сроки или быстрее. Гарантируем выполнение всех условий договора",
    },
    {
      value: "24/7",
      label: "Поддержка клиентов",
      description: "Ваш персональный менеджер всегда на связи и готов ответить на любые вопросы",
    },
    {
      value: "Гарантия",
      label: "На всю технику",
      description: "На всю поставляемую технику. Несем полную ответственность за качество и сохранность спецтехники",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-4">
            <Package className="w-5 h-5" />
            <span className="font-semibold">О компании</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            ООО АСТС — Ваш надежный партнер в поставке спецтехники
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Мы оказываем все услуги по доставке и поставке спецтехники из Китая в Россию. Можем выполнить проект любой
            сложности.
          </p>
        </motion.div>

        {/* Services Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Чем мы можем быть Вам полезны</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="border-2 hover:border-blue-200 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <Card className="border-2 border-blue-100">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-4xl mx-auto text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  ООО «АСТС»— это команда профессионалов по поставке спецтехники
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Наши менеджеры, логисты и специалисты имеют большой опыт работы в сфере поставок строительной техники
                  из Китая. Мы работаем с каждым клиентом индивидуально, находим решение каждой поставленной задачи.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Среди наших клиентов присутствуют крупные российские компании – представители строительства и
                  ��едвижимости, промышленного производства, сельского хозяйства и инфраструктурных проектов.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Наша работа в цифрах</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statistics.map((stat, index) => (
              <Card key={index} className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-6">
                  <div className="text-4xl font-black text-blue-600 mb-3">{stat.value}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{stat.label}</h3>
                  <p className="text-gray-600 leading-relaxed">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-600 to-blue-500 text-white bg-slate-500">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  ООО «АСТС» — надежные поставки спецтехники из Китая
                </h2>
                <p className="text-lg md:text-xl text-blue-100 leading-relaxed">
                  Мы знаем, как эффективно организовать поставки спецтехники из Китая. Используем весь накопленный опыт,
                  решаем сложные задачи, предоставляем широкий спектр консалтинговых и транспортных услуг. Отслеживаем и
                  доставляем технику максимально эффективно. Гарантируем сроки доставки и сохранность техники.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16"
        >
          <Card className="border-2 border-blue-100">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Появились вопросы? Напишите нам.</h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Оставьте заявку на консультацию, и наш специалист свяжется с вами в ближайшее время
                </p>
                <Link href="/#application">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-6">
                    Оставить заявку на консультацию
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="border-2 border-blue-100">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Контактная информация</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Phone className="w-6 h-6 text-blue-600" />
                  <a
                    href="tel:+79190422492"
                    className="text-gray-700 hover:text-blue-600 transition-colors font-semibold"
                  >
                    +7 919 042 24 92
                  </a>
                </div>
                <div className="flex flex-col items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                  <a
                    href="mailto:zhukovigor@yandex.ru"
                    className="text-gray-700 hover:text-blue-600 transition-colors font-semibold"
                  >
                    zhukovigor@yandex.ru
                  </a>
                </div>
                <div className="flex flex-col items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <span className="text-gray-700 font-semibold">Смоленская область</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
