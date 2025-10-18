"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calculator, CheckCircle, FileText, Headphones, HelpCircle, TrendingUp } from "lucide-react"
import { submitLeasingRequest } from "@/app/actions/submit-leasing"

export default function LeasingPageClient() {
  // Calculator state
  const [equipmentCost, setEquipmentCost] = useState(5000000)
  const [initialPayment, setInitialPayment] = useState(20)
  const [leasingTerm, setLeasingTerm] = useState(36)

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [consent, setConsent] = useState(false)

  // FAQ state
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  // Calculate leasing payments
  const initialPaymentAmount = (equipmentCost * initialPayment) / 100
  const leasingAmount = equipmentCost - initialPaymentAmount
  const monthlyRate = 0.01 // 12% годовых / 12 месяцев
  const monthlyPayment =
    (leasingAmount * monthlyRate * Math.pow(1 + monthlyRate, leasingTerm)) /
    (Math.pow(1 + monthlyRate, leasingTerm) - 1)
  const totalPayment = initialPaymentAmount + monthlyPayment * leasingTerm
  const overpayment = totalPayment - equipmentCost

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await submitLeasingRequest(formData)

    setIsSubmitting(false)

    if (result.success) {
      setMessage({
        type: "success",
        text: "Спасибо! Мы свяжемся с вами в ближайшее время для обсуждения условий лизинга.",
      })
      ;(e.target as HTMLFormElement).reset()
      setConsent(false)
    } else {
      setMessage({ type: "error", text: result.error || "Произошла ошибка" })
    }
  }

  const faqData = {
    general: [
      {
        question: "Что такое лизинг спецтехники?",
        answer:
          "Лизинг - это долгосрочная аренда техники с правом выкупа. Вы пользуетесь экскаватором, платите ежемесячные платежи, а по окончании срока можете выкупить технику по остаточной стоимости.",
      },
      {
        question: "В чем преимущества лизинга перед кредитом?",
        answer:
          "Лизинг позволяет снизить налоговую нагрузку (платежи относятся на расходы), требует меньший первоначальный взнос (от 10%), упрощенное оформление без залога, возможность применения ускоренной амортизации.",
      },
      {
        question: "Какой минимальный первоначальный взнос?",
        answer:
          "Минимальный первоначальный взнос составляет 10% от стоимости техники. Чем больше взнос, тем ниже ежемесячные платежи.",
      },
      {
        question: "На какой срок можно оформить лизинг?",
        answer:
          "Срок лизинга от 12 до 60 месяцев. Оптимальный срок - 36 месяцев, который позволяет сбалансировать размер ежемесячного платежа и переплату.",
      },
    ],
    registration: [
      {
        question: "Какие документы нужны для оформления?",
        answer:
          "Для юридических лиц: устав, свидетельство о регистрации, ИНН, финансовая отчетность за последний год. Для ИП: паспорт, свидетельство о регистрации ИП, налоговая декларация.",
      },
      {
        question: "Сколько времени занимает оформление?",
        answer:
          "Рассмотрение заявки - 1-2 рабочих дня. Подготовка договора - 1-3 дня. Общий срок от подачи заявки до получения техники - 5-7 рабочих дней.",
      },
      {
        question: "Можно ли оформить лизинг на б/у технику?",
        answer:
          "Да, мы предоставляем лизинг как на новую, так и на подержанную спецтехнику из Китая. Условия могут отличаться в зависимости от года выпуска и состояния техники.",
      },
      {
        question: "Нужен ли залог или поручители?",
        answer:
          "Предмет лизинга (техника) является обеспечением по договору. Дополнительный залог или поручители обычно не требуются.",
      },
    ],
    support: [
      {
        question: "Кто обслуживает технику в период лизинга?",
        answer:
          "Техническое обслуживание осуществляет лизингополучатель (вы). Мы предоставляем консультации по обслуживанию и можем рекомендовать сервисные центры.",
      },
      {
        question: "Что будет, если техника сломается?",
        answer:
          "Рекомендуем оформить страхование техники. В случае поломки вы продолжаете платить по графику, но страховая компания может покрыть расходы на ремонт.",
      },
      {
        question: "Можно ли досрочно выкупить технику?",
        answer:
          "Да, досрочный выкуп возможен. Вы оплачиваете остаток задолженности и выкупную стоимость, после чего техника переходит в вашу собственность.",
      },
      {
        question: "Можно ли изменить график платежей?",
        answer:
          "В исключительных случаях возможна реструктуризация графика платежей. Необходимо обратиться к нашим специалистам для обсуждения индивидуальных условий.",
      },
    ],
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="absolute inset-0 bg-grid-subtle opacity-10 pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-wide">ЛИЗИНГ СПЕЦТЕХНИКИ </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              {"Выгодные условия лизинга на спецтехнику.\nМинимальный первоначальный взнос от 10%, срок до 5 лет."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-center mb-16 tracking-wide text-gray-900"
          >
            ПРЕИМУЩЕСТВА ЛИЗИНГА
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp size={40} />,
                title: "Налоговая оптимизация",
                description: "Лизинговые платежи относятся на расходы, снижая налогооблагаемую базу",
              },
              {
                icon: <CheckCircle size={40} />,
                title: "Низкий первый взнос",
                description: "Начните работать с техникой, внеся всего 10-20% от стоимости",
              },
              {
                icon: <FileText size={40} />,
                title: "Простое оформление",
                description: "Минимум документов, быстрое рассмотрение заявки за 1-2 дня",
              },
              {
                icon: <Calculator size={40} />,
                title: "Гибкие условия",
                description: "Индивидуальный график платежей под ваш бизнес",
              },
              {
                icon: <Headphones size={40} />,
                title: "Полное сопровождение",
                description: "Помощь на всех этапах от выбора техники до оформления",
              },
              {
                icon: <HelpCircle size={40} />,
                title: "Без залога",
                description: "Техника является обеспечением, дополнительный залог не требуется",
              },
            ].map((advantage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="text-gray-900 mb-4">{advantage.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-wide">{advantage.title}</h3>
                <p className="text-gray-600 leading-relaxed">{advantage.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-center mb-16 tracking-wide text-gray-900"
          >
            КАЛЬКУЛЯТОР ЛИЗИНГА
          </motion.h2>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Calculator Inputs */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-4">
                    Стоимость техники: {equipmentCost.toLocaleString("ru-RU")} ₽
                  </label>
                  <input
                    type="range"
                    min="1000000"
                    max="20000000"
                    step="100000"
                    value={equipmentCost}
                    onChange={(e) => setEquipmentCost(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>1 млн ₽</span>
                    <span>20 млн ₽</span>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-4">
                    Первоначальный взнос: {initialPayment}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>10%</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-4">Срок лизинга: {leasingTerm} мес.</label>
                  <input
                    type="range"
                    min="12"
                    max="60"
                    step="6"
                    value={leasingTerm}
                    onChange={(e) => setLeasingTerm(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>12 мес.</span>
                    <span>60 мес.</span>
                  </div>
                </div>
              </motion.div>

              {/* Calculator Results */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gray-900 text-white p-8 rounded-lg shadow-xl"
              >
                <h3 className="text-2xl font-bold mb-6 tracking-wide">РАСЧЕТ ПЛАТЕЖЕЙ</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                    <span className="text-gray-300">Первоначальный взнос:</span>
                    <span className="text-xl font-bold">{initialPaymentAmount.toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                    <span className="text-gray-300">Сумма лизинга:</span>
                    <span className="text-xl font-bold">{leasingAmount.toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                    <span className="text-gray-300">Ежемесячный платеж:</span>
                    <span className="text-2xl font-bold text-green-400">
                      {Math.round(monthlyPayment).toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                    <span className="text-gray-300">Общая сумма выплат:</span>
                    <span className="text-xl font-bold">{Math.round(totalPayment).toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Переплата:</span>
                    <span className="text-xl font-bold">{Math.round(overpayment).toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-6">
                  * Расчет является предварительным. Точные условия определяются индивидуально.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-center mb-16 tracking-wide text-gray-900"
          >
            ПОЛЕЗНО ЗНАТЬ
          </motion.h2>

          <div className="max-w-4xl mx-auto space-y-12">
            {/* General Questions */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 tracking-wide">Общие вопросы</h3>
              <div className="space-y-4">
                {faqData.general.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === `general-${index}` ? null : `general-${index}`)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-bold text-gray-900">{faq.question}</span>
                      <span className="text-2xl text-gray-600">{openFaq === `general-${index}` ? "−" : "+"}</span>
                    </button>
                    {openFaq === `general-${index}` && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Registration */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 tracking-wide">Оформление</h3>
              <div className="space-y-4">
                {faqData.registration.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === `registration-${index}` ? null : `registration-${index}`)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-bold text-gray-900">{faq.question}</span>
                      <span className="text-2xl text-gray-600">{openFaq === `registration-${index}` ? "−" : "+"}</span>
                    </button>
                    {openFaq === `registration-${index}` && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 tracking-wide">Сопровождение</h3>
              <div className="space-y-4">
                {faqData.support.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === `support-${index}` ? null : `support-${index}`)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-bold text-gray-900">{faq.question}</span>
                      <span className="text-2xl text-gray-600">{openFaq === `support-${index}` ? "−" : "+"}</span>
                    </button>
                    {openFaq === `support-${index}` && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-black text-center mb-8 tracking-wide text-gray-900">
              ЗАЯВКА НА ЛИЗИНГ
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 leading-relaxed">
              Заполните форму, и наш специалист свяжется с вами для расчета индивидуальных условий лизинга
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Ваше имя *"
                  required
                  disabled={isSubmitting}
                  className="px-4 py-3 border-2 border-gray-300 rounded-md focus:border-gray-900 focus:outline-none text-gray-900 font-medium disabled:opacity-50"
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Название компании *"
                  required
                  disabled={isSubmitting}
                  className="px-4 py-3 border-2 border-gray-300 rounded-md focus:border-gray-900 focus:outline-none text-gray-900 font-medium disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Телефон *"
                  required
                  disabled={isSubmitting}
                  className="px-4 py-3 border-2 border-gray-300 rounded-md focus:border-gray-900 focus:outline-none text-gray-900 font-medium disabled:opacity-50"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email *"
                  required
                  disabled={isSubmitting}
                  className="px-4 py-3 border-2 border-gray-300 rounded-md focus:border-gray-900 focus:outline-none text-gray-900 font-medium disabled:opacity-50"
                />
              </div>

              <input
                type="text"
                name="equipment"
                placeholder="Интересующая модель техники"
                disabled={isSubmitting}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:border-gray-900 focus:outline-none text-gray-900 font-medium disabled:opacity-50"
              />

              <textarea
                name="message"
                placeholder="Дополнительная информация (необязательно)"
                rows={4}
                disabled={isSubmitting}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:border-gray-900 focus:outline-none text-gray-900 font-medium resize-none disabled:opacity-50"
              />

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="consent-leasing"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <label htmlFor="consent-leasing" className="text-sm text-gray-700 leading-relaxed">
                  Оставляя заявку, вы соглашаетесь на обработку персональных данных, условия пользовательского
                  соглашения, получение информации об акциях, ценах и скидках от ООО «АСТС».
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !consent}
                className="w-full px-8 py-4 bg-gray-900 hover:bg-gray-700 text-white font-bold rounded-md transition-colors duration-300 tracking-wide text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "ОТПРАВКА..." : "ОТПРАВИТЬ ЗАЯВКУ"}
              </button>

              {message && (
                <div
                  className={`p-4 rounded-md ${
                    message.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </form>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-wide">КОНТАКТНАЯ ИНФОРМАЦИЯ</h3>
              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Телефон:</strong>{" "}
                  <a href="tel:+79190422492" className="text-gray-900 hover:underline">
                    +7 (919) 042-24-92
                  </a>
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:zhukovigor@yandex.ru" className="text-gray-900 hover:underline">
                    zhukovigor@yandex.ru
                  </a>
                </p>
                <p>
                  <strong>WhatsApp:</strong>{" "}
                  <a
                    href="https://wa.me/79190422492"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:underline"
                  >
                    Написать в WhatsApp
                  </a>
                </p>
                <p>
                  <strong>Telegram:</strong>{" "}
                  <a
                    href="https://t.me/zhukovigor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:underline"
                  >
                    Написать в Telegram
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
