"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem("cookieConsent")
    if (!hasAccepted) {
      // Show popup after a short delay
      setTimeout(() => {
        setIsVisible(true)
      }, 1000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true")
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-6 z-50 max-w-md"
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Сайт использует файлы cookies</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Сайт использует данные cookie для сервисов веб-аналитики Яндекс.Метрика, VK пиксель, top.mail.ru.
                  Продолжая использовать наш сайт, вы автоматически соглашаетесь с использованием данных технологий и
                  принимаете{" "}
                  <Link href="/politika-obrabotki-dannyh" className="text-blue-600 hover:underline font-medium">
                    политику обработки данных
                  </Link>
                  .
                </p>
                <button
                  onClick={handleAccept}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
                >
                  Понятно
                </button>
              </div>
              <button
                onClick={handleAccept}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
