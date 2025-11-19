"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { CheckCircle2, Truck, Shield, Wrench, Clock, Award, TrendingDown } from "lucide-react"

export default function ConcretePumpsClient() {
  const models = [
    {
      id: "zoomlion-31",
      name: "Zoomlion 31м",
      brand: "ZOOMLION",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Zoomlion%2031%20%D0%BC%D0%B5%D1%82%D1%80-7caICdI5tnoEzRFc27BAC31ca07PwA.jpg",
      specs: {
        reach: "31 метр",
        vertical: "26.5 м",
        horizontal: "30.8 м",
        productivity: "125 м³/час",
        pressure: "13 МПа",
        sections: "5 секций",
        rotation: "±360°",
        chassis: "FAW JIEFANG 4x2",
        power: "194 кВт",
        weight: "20,000 кг",
      },
    },
    {
      id: "sany-33",
      name: "SANY 33м",
      brand: "SANY",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/33%20%D0%BC%D0%B5%D1%82%D1%80%D0%B0-UqRLDdv2Xvb9GDoz55SA4D5nXiPuqs.jpg",
      specs: {
        reach: "33 метра",
        vertical: "32.2 м",
        horizontal: "28.2 м",
        productivity: "120 м³/час",
        pressure: "9.6 МПа",
        sections: "5 секций",
        rotation: "±360°",
        chassis: "SANY 4x2",
        power: "191 кВт",
        weight: "21,000 кг",
      },
    },
    {
      id: "zoomlion-50",
      name: "Zoomlion 50м",
      brand: "ZOOMLION",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Zoomlion%2050%20%D0%BC%D0%B5%D1%82%D1%80%D0%BE%D0%B2-18g66k19qJogcJ7PzbnVJADWvm7wrJ.jpg",
      specs: {
        reach: "50 метров",
        vertical: "49.3 м",
        horizontal: "44.3 м",
        productivity: "170 м³/час",
        pressure: "8.8 МПа",
        sections: "6 секций",
        rotation: "±360°",
        chassis: "6x4",
        power: "316 кВт",
        weight: "36,900 кг",
      },
    },
  ]

  const advantages = [
    {
      title: "Прямы�� поставки от производителей",
      description: "Работаем напрямую с заводами SANY и Zoomlion, что позволяет предлагать лучшие цены на рынке",
      icon: <TrendingDown className="w-8 h-8" />,
    },
    {
      title: "Широкий выбор моделей",
      description: "От компактных 31-метровых до мощных 73-метровых автобетононасосов для любых задач",
      icon: <Truck className="w-8 h-8" />,
    },
    {
      title: "Новая и б/у техника",
      description: "Предлагаем как новые автобетононасосы, так и проверенную технику с пробегом в отличном состоянии",
      icon: <Award className="w-8 h-8" />,
    },
    {
      title: "Полное сопровождение",
      description: "Помощь в выборе, доставка, растаможка, оформление документов и гарантийное обслуживание",
      icon: <Shield className="w-8 h-8" />,
    },
    {
      title: "Быстрая доставка",
      description: "Оптимизированная логистика позволяет доставлять технику в кратчайшие сроки по всей России",
      icon: <Clock className="w-8 h-8" />,
    },
    {
      title: "Гибкие условия оплаты",
      description: "Возможность лизинга, рассрочки и индивидуальных условий для каждого клиента",
      icon: <Wrench className="w-8 h-8" />,
    },
  ]

  const faqs = [
    {
      question: "Какие модели автобетононасосов вы предлагаете?",
      answer:
        "Мы предлагаем широкий выбор автобетононасосов SANY и Zoomlion с вылетом стрелы от 31 до 73 метров. В наличии модели: Zoomlion 31м, SANY 33м, Zoomlion 50м, Zoomlion 62м и другие. Все модели доступны как новые, так и с пробегом в отличном состоянии.",
    },
    {
      question: "Сколько стоит автобетононасос?",
      answer:
        "Стоимость автобетононасоса зависит от модели, года выпуска и комплектации. Цены на новые автобетононасосы начинаются от 23 млн рублей за модель 31-33 метра. Для получения точной цены с учетом доставки оставьте заявку на сайте или свяжитесь с нашими специалистами.",
    },
    {
      question: "Какой срок доставки автобетононасоса из Китая?",
      answer:
        "Срок поставки автобетононасоса составляет от 30 до 60 дней в зависимости от модели и наличия на складе. Новая техника поставляется в течение 30-45 дней после предоплаты. Мы обеспечиваем полное сопровождение на всех этапах доставки и растаможки.",
    },
    {
      question: "Предоставляете ли вы гарантию на автобетононасосы?",
      answer:
        "Да, на все новые автобетононасосы предоставляется гарантия производителя сроком 12 месяцев на силовые узлы �� агрегаты. Мы также обеспечиваем гарантийное и постгарантийное обслуживание, поставку оригинальных запчастей.",
    },
    {
      question: "Можно ли купить автобетононасос в лизинг?",
      answer:
        "Да, мы предлагаем гибкие условия лизинга для приобретения автобетононасосов. Работаем с ведущими лизинговыми компаниями России. Первоначальный взнос от 10%, срок лизинга до 5 лет. Подробности уточняйте у наших специалистов.",
    },
    {
      question: "Чем отличаются автобетононасосы SANY и Zoomlion?",
      answer:
        "SANY и Zoomlion - ведущие китайские производители строительной техники. SANY известен надежностью и современными технологиями, Zoomlion предлагает отличное соотношение цены и качества. Обе марки имеют сертификаты качества, широкую сеть сервисных центров и доступные запчасти.",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-wider mb-6 text-gray-900">
              АВТОБЕТОНОНАСОСЫ SANY И ZOOMLION
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Поставка новых и б/у автобетононасосов из Китая. Модели от 31 до 73 метров с полным сопровождением и
              выгодными ценами
            </p>
          </motion.div>

          {/* Main Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-2xl"
          >
            <Image
              src="/images/design-mode/SANY-Kitay_42549_4858854752.jpg"
              alt="Автобетононасос SANY 33 метра - красный бетононасос на строительной площадке"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="relative py-20 bg-white">
        <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-6 text-gray-900">
              ПОЧЕМУ СТОИТ ПОКУПАТЬ АВТОБЕТОНОНАСОСЫ У НАС?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Мы находим для наших клиентов автобетононасосы с наилучшей ценой и обеспечиваем полную поддержку на всех
              этапах
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <motion.div
                key={advantage.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="text-blue-600 mb-4">{advantage.icon}</div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900">{advantage.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{advantage.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section with Tabs */}
      <section className="relative py-20 bg-gray-50">
        <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-6 text-gray-900">
              МОДЕЛИ АВТОБЕТОНОНАСОСОВ
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Выберите подходящую модель для ваших строительных задач
            </p>
          </motion.div>

          <Tabs defaultValue="zoomlion-31" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-8 h-auto">
              {models.map((model) => (
                <TabsTrigger key={model.id} value={model.id} className="text-lg py-4">
                  {model.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {models.map((model) => (
              <TabsContent key={model.id} value={model.id}>
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="relative h-[400px] lg:h-full">
                      <Image
                        src={model.image || "/placeholder.svg"}
                        alt={`${model.brand} ${model.name} автобетононасос - технические характеристики и фото`}
                        fill
                        className="object-cover"
                        loading="lazy"
                      />
                    </div>

                    <CardContent className="p-8">
                      <h3 className="text-3xl font-black mb-2 text-gray-900">{model.name}</h3>
                      <p className="text-xl text-gray-600 mb-6">Производитель: {model.brand}</p>

                      <div className="space-y-4 mb-8">
                        <h4 className="text-xl font-bold text-gray-900">Технические характеристики:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                              <p className="font-semibold text-gray-900">Вылет стрелы</p>
                              <p className="text-gray-600">{model.specs.reach}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                              <p className="font-semibold text-gray-900">Вертикальный вылет</p>
                              <p className="text-gray-600">{model.specs.vertical}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                              <p className="font-semibold text-gray-900">Горизонтальный вылет</p>
                              <p className="text-gray-600">{model.specs.horizontal}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                              <p className="font-semibold text-gray-900">Производительность</p>
                              <p className="text-gray-600">{model.specs.productivity}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                              <p className="font-semibold text-gray-900">Давление</p>
                              <p className="text-gray-600">{model.specs.pressure}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                              <p className="font-semibold text-gray-900">Количество секций</p>
                              <p className="text-gray-600">{model.specs.sections}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                              <p className="font-semibold text-gray-900">Шасси</p>
                              <p className="text-gray-600">{model.specs.chassis}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="text-green-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                              <p className="font-semibold text-gray-900">Мощность</p>
                              <p className="text-gray-600">{model.specs.power}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Link href="/#application">
                        <Button size="lg" className="w-full md:w-auto text-lg">
                          Узнать цену
                        </Button>
                      </Link>
                    </CardContent>
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section className="relative py-20 bg-white">
        <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-6 text-gray-900 text-center">
              ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12">
              Ответы на популярные вопросы о покупке автобетононасосов
            </p>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-2 rounded-lg px-6 bg-white">
                  <AccordionTrigger className="text-lg font-bold text-gray-900 hover:text-blue-600">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 bg-gray-50">
        <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-wider mb-6 text-gray-900">СМОТРИТЕ ТАКЖЕ</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Другая спецтехника и услуги от ООО АСТС</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/komatsu">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Экскаваторы Komatsu</h3>
                  <p className="text-gray-600">Гусеничные экскаваторы PC200, PC300, PC400 из Китая</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/v-lizing">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">Лизинг спецтехники</h3>
                  <p className="text-gray-600">Выгодные условия лизинга от 10% первоначального взноса</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/o-nas">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">О компании</h3>
                  <p className="text-gray-600">Узнайте больше о нашем опыте и преимуществах</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-wider mb-6 text-gray-900">
              ГОТОВЫ ПРИОБРЕСТИ АВТОБЕТОНОНАСОС?
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Оставьте заявку, и наши специалисты помогут подобрать оптимальную модель для ваших задач и рассчитают
              стоимость с доставкой
            </p>
            <Link href="/#application">
              <Button size="lg" className="text-lg px-8 py-6">
                Оставить заявку
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
