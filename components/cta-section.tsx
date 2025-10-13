"use client"
import { motion } from "framer-motion"
import { Truck, Package, Shield, Clock, MessageCircle, Send } from "lucide-react"

export default function CTASection() {
  return (
    <section id="join" className="relative py-32 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none" />

      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gray-900/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gray-900/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-wider mb-6 text-gray-900 leading-none lg:text-7xl">
            ГОТОВЫ
            <br />
            <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
              НАЧАТЬ РАБОТУ?
            </span>
          </h2>

          <p className="text-xl md:text-2xl lg:text-3xl text-gray-700 mb-12 leading-relaxed font-medium">
            Свяжитесь с нами для консультации и подбора
            <br className="hidden md:block" />
            оптимального решения для вашего бизнеса
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">100+</div>
              <div className="text-sm md:text-base text-gray-600 font-medium">Единиц техники</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">Под ключ</div>
              <div className="text-sm md:text-base text-gray-600 font-medium">Полный сервис</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">С НДС</div>
              <div className="text-sm md:text-base text-gray-600 font-medium">Все документы</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-black text-gray-900 mb-1">24/7</div>
              <div className="text-sm md:text-base text-gray-600 font-medium">Поддержка</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center gap-4 mb-8"
          >
            <a
              href="https://wa.me/79190422492"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-lg tracking-wide rounded-lg transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp
            </a>
            <a
              href="https://t.me/zhukovigor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-lg tracking-wide rounded-lg transition-all duration-300 hover:scale-105"
            >
              <Send className="w-6 h-6" />
              Telegram
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-16 pt-8 border-t border-gray-200"
          >
            <p className="text-sm text-gray-500 mb-4 font-medium">НАДЕЖНЫЙ ПАРТНЕР</p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
              <span className="text-sm font-semibold">🚜 НОВАЯ И Б/У ТЕХНИКА</span>
              <span className="text-sm font-semibold">🇨🇳 ПРЯМЫЕ ПОСТАВКИ</span>
              <span className="text-sm font-semibold">📋 ВСЕ ДОКУМЕНТЫ</span>
              <span className="text-sm font-semibold">💼 ВЫГОДНЫЕ ЦЕНЫ</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
