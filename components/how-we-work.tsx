"use client"

import { motion } from "framer-motion"
import { FileText, Search, FileSignature, Truck, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: FileText,
    title: "Заявка",
    description: "Оставьте заявку на сайте или свяжитесь с нами по телефону. Мы обсудим ваши требования и задачи.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Search,
    title: "Подбор техники",
    description: "Наши специалисты подберут оптимальную технику под ваши задачи и бюджет из наличия или под заказ.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: FileSignature,
    title: "Договор",
    description: "Заключаем договор с прозрачными условиями. Предоставляем все необходимые документы и гарантии.",
    color: "from-pink-500 to-pink-600",
  },
  {
    icon: Truck,
    title: "Доставка",
    description: "Организуем доставку техники из Китая, растаможку и транспортировку до вашего объекта по всей России.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: CheckCircle,
    title: "Получение",
    description: "Передаем технику с полным комплектом документов. Предоставляем консультации по эксплуатации.",
    color: "from-green-500 to-green-600",
  },
]

export default function HowWeWork() {
  return (
    <section className="relative py-20 bg-white">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-wider text-gray-900 mb-6">КАК МЫ РАБОТАЕМ</h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Простой и прозрачный процесс от заявки до получения техники
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 h-full flex flex-col">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {index + 1}
                </div>

                {/* Icon */}
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mb-4 mt-4`}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed flex-grow">{step.description}</p>
              </div>

              {/* Connector Arrow (hidden on last item and mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 16H28M28 16L20 8M28 16L20 24"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
