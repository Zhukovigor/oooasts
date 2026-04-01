"use client"

import { motion } from "framer-motion"
import { MapPin } from "lucide-react"

const cities = [
  { name: "Москва", top: "35%", left: "48%" },
  { name: "Санкт-Петербург", top: "25%", left: "45%" },
  { name: "Новосибирск", top: "40%", left: "75%" },
  { name: "Екатеринбург", top: "38%", left: "60%" },
  { name: "Казань", top: "37%", left: "52%" },
  { name: "Нижний Новгород", top: "36%", left: "50%" },
  { name: "Челябинск", top: "42%", left: "62%" },
  { name: "Самара", top: "43%", left: "52%" },
  { name: "Омск", top: "42%", left: "70%" },
  { name: "Ростов-на-Дону", top: "52%", left: "48%" },
  { name: "Уфа", top: "42%", left: "58%" },
  { name: "Красноярск", top: "38%", left: "82%" },
  { name: "Воронеж", top: "45%", left: "48%" },
  { name: "Пермь", top: "38%", left: "58%" },
  { name: "Волгоград", top: "50%", left: "50%" },
  { name: "Смоленск", top: "40%", left: "45%", isMain: true },
]

export default function ServiceMap() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-white to-gray-50">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-wider text-gray-900 mb-6">ГЕОГРАФИЯ РАБОТЫ</h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Доставляем спецтехнику из Китая по всей России.   
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Map Container */}
          

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            >
              <div className="text-4xl font-black text-blue-600 mb-2">15+</div>
              <div className="text-gray-900 font-bold mb-1">Крупных городов</div>
              <div className="text-gray-600 text-sm">Доставка в крупнейшие города России</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            >
              <div className="text-4xl font-black text-blue-600 mb-2">85</div>
              <div className="text-gray-900 font-bold mb-1">Регионов РФ</div>
              <div className="text-gray-600 text-sm">Работаем по всей территории России</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
            >
              <div className="text-4xl font-black text-blue-600 mb-2">24/7</div>
              <div className="text-gray-900 font-bold mb-1">Поддержка</div>
              <div className="text-gray-600 text-sm">Консультации в любое время</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
