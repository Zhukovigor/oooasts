"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ExcavatorModels() {
  const models = [
    {
      name: "Komatsu PC200",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250928-WA0007-SP2bEOhxUA4q43KyjUxSnmH5q42Ot6.jpg",
      specs: {
        power: "110 кВт",
        weight: "20 тонн",
        depth: "6,3 м",
      },
      features: [
        "Высокая производительность",
        "Экономичный расход топлива",
        "Простота обслуживания",
        "Доступные запчасти",
      ],
    },
    {
      name: "Komatsu PC300",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20250924-WA0013-KWy9wO28j8PP3TRK8Tsx5l9VTS6pcb.jpg",
      specs: {
        power: "155 кВт",
        weight: "30 тонн",
        depth: "7,2 м",
      },
      features: ["Увеличенная мощность", "Надежная конструкция", "Комфортная кабина", "Современная гидравлика"],
    },
    {
      name: "Komatsu PC400",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hot-Sale-Used-Komatsu-PC400-Excavator-PC50-PC40-PC30-0lvJNSAZvQNv2imZHod9A8bv7ttTDf.jpg",
      specs: {
        power: "200 кВт",
        weight: "40 тонн",
        depth: "7,8 м",
      },
      features: [
        "Максимальная производительность",
        "Тяжелые условия работы",
        "Долговечность",
        "Высокая грузоподъемность",
      ],
    },
  ]

  return (
    <section id="models" className="relative py-20 bg-gray-50">
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-wider mb-6 text-gray-900">ЭКСКАВАТОРЫ KOMATSU</h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Надежный выбор для строительства и горных работ
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {models.map((model, index) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-64 w-full">
                  <Image src={model.image || "/placeholder.svg"} alt={model.name} fill className="object-cover" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">{model.name}</h3>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Характеристики:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Мощность двигателя: {model.specs.power}</li>
                      <li>• Рабочий вес: {model.specs.weight}</li>
                      <li>• Глубина копания: {model.specs.depth}</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Преимущества:</h4>
                    <ul className="space-y-1 text-gray-600">
                      {model.features.map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Почему стоит купить экскаватор Komatsu?</h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Экскаваторы Komatsu зарекомендовали себя как надежная техника для строительства и горных работ. Высокое
            качество сборки, экономичность и простота обслуживания делают их оптимальным выбором для российских условий
            эксплуатации. Мы поставляем как новые, так и проверенные б/у экскаваторы с полным документальным
            сопровождением.
          </p>

          <div className="mb-16">
            <h3 className="text-3xl mb-8 text-center text-gray-900 font-black md:text-6xl">
              Автобетононасосы SANY и ZOOMLION
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* SANY 33m Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                  <div className="relative h-64 w-full">
                    <Image
                      src="/images/design-mode/33%20%D0%BC%D0%B5%D1%82%D1%80%D0%B0.jpg"
                      alt="SANY 33 метра"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col">
                    <h4 className="text-2xl font-bold mb-4 text-gray-900 text-left">SANY 33 метра</h4>
                    <div className="mb-4 flex-grow">
                      <h5 className="font-semibold text-gray-700 mb-2 text-left">Характеристики:</h5>
                      <ul className="space-y-1 text-gray-600 text-sm">
                        <li className="text-left">• Вертикальный вылет: 32.2 м</li>
                        <li className="text-left">• Горизонтальный вылет: 28.2 м</li>
                        <li className="text-left">• Производительность: 120 м³/ч</li>
                        <li className="text-left">• Давление: 9.6 МПа</li>
                        <li className="text-left">• Шасси: 4x2</li>
                      </ul>
                    </div>
                    <Link href="/#application" className="mt-4">
                      <Button className="w-full">Узнать цену</Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Zoomlion 31m Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                  <div className="relative h-64 w-full">
                    <Image
                      src="/images/design-mode/Zoomlion%2031%20%D0%BC%D0%B5%D1%82%D1%80.jpg"
                      alt="Zoomlion 31 метр"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col">
                    <h4 className="text-2xl font-bold mb-4 text-gray-900 text-left">Zoomlion 31 метр</h4>
                    <div className="mb-4 flex-grow">
                      <h5 className="font-semibold text-gray-700 mb-2 text-left">Характеристики:</h5>
                      <ul className="space-y-1 text-gray-600 text-sm">
                        <li className="text-left">• Вертикальный вылет: 26.5 м</li>
                        <li className="text-left">• Горизонтальный вылет: 30.8 м</li>
                        <li className="text-left">• Производительность: 125 м³/ч</li>
                        <li className="text-left">• Давление: 13 МПа</li>
                        <li className="text-left">• Шасси: 4x2</li>
                      </ul>
                    </div>
                    <Link href="/#application" className="mt-4">
                      <Button className="w-full">Узнать цену</Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Zoomlion 50m Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                  <div className="relative h-64 w-full">
                    <Image
                      src="/images/design-mode/Zoomlion%2050%20%D0%BC%D0%B5%D1%82%D1%80%D0%BE%D0%B2.jpg"
                      alt="Zoomlion 50 метров"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-6 flex-grow flex flex-col">
                    <h4 className="text-2xl font-bold mb-4 text-gray-900 text-left">Zoomlion 50 метров</h4>
                    <div className="mb-4 flex-grow">
                      <h5 className="font-semibold text-gray-700 mb-2 text-left">Характеристики:</h5>
                      <ul className="space-y-1 text-gray-600 text-sm">
                        <li className="text-left">• Макс. объем подачи: 170 м³/ч</li>
                        <li className="text-left">• Макс. давление: 8.8 МПа</li>
                        <li className="text-left">• Высота заполнения: 1540 мм</li>
                        <li className="text-left">• Вертикальный вылет: 49.3 м</li>
                        <li className="text-left">• Горизонтальный вылет: 44.3 м</li>
                      </ul>
                    </div>
                    <Link href="/#application" className="mt-4">
                      <Button className="w-full">Узнать цену</Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-gray-200">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
              Почему стоит покупать автобетононасосы у нас?
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Мы специализируемся на поставке автобетононасосов SANY и Zoomlion из Китая и находим для наших клиентов
              лучшие предложения на рынке. Прямое сотрудничество с производителями позволяет нам предлагать выгодные
              цены без посредников. Полное сопровождение сделки, помощь в выборе модели, организация доставки и
              растаможка - мы берем на себя все заботы, чтобы вы получили надежную технику в кратчайшие сроки.
            </p>
            <Link href="/avtobetonanosy">
              <Button size="lg" className="text-lg">
                Подробнее об автобетононасосах
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
