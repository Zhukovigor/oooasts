"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { submitLead } from "@/app/actions/submit-lead"
import { handleFormConversion } from "@/app/config/retargeting"

export default function ApplicationForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [consent, setConsent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const result = await submitLead(formData)

      if (result.success) {
        await handleFormConversion({
          leadTemperature: result.leadTemperature || "warm",
          formType: "application",
          leadScore: result.leadScore,
          abTestVariant: sessionStorage.getItem("ab_test_variant_application_form"),
        })

        setSubmitStatus("success")
        setFormData({ name: "", phone: "", email: "", message: "" })
        setConsent(false)
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <section id="application" className="relative py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black tracking-wider text-gray-900 mb-4 md:text-6xl">ЗАЯВКУ НА ТЕХНИКУ </h2>
            <p className="text-lg text-gray-600">Заполните ЗАЯВКУ и мы свяжемся с вами для обсуждения всех деталей</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Ваше имя *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Телефон *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                placeholder="example@mail.ru"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Сообщение (необязательно)
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                placeholder="Расскажите о вашем проекте или задайте вопрос..."
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="consent"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
                Оставляя заявку, вы соглашаетесь на обработку персональных данных, условия пользовательского соглашения,
                получение информации об акциях, ценах и скидках от ООО «АСТС».
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !consent}
              className="w-full bg-gray-900 text-white font-bold py-4 px-8 rounded-lg hover:bg-gray-800 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-wide"
            >
              {isSubmitting ? "ОТПРАВКА..." : "ОТПРАВИТЬ ЗАЯВКУ"}
            </button>

            {submitStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-medium"
              >
                ✓ Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.
              </motion.div>
            )}

            {submitStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center font-medium"
              >
                ✗ Произошла ошибка. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону.
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  )
}
