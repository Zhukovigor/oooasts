"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Briefcase, MapPin, Users, RussianRubleIcon, Clock, CheckCircle, Phone, Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import HeroSection from "@/hero-section"
import Footer from "@/components/footer"
import { submitJobApplication } from "@/app/actions/submit-job-application"

export default function VacanciesClient() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [phone, setPhone] = useState("")
  const [consent, setConsent] = useState(false)

  const formatPhoneNumber = (value: string) => {
    // Удаляем все нецифровые символы
    const cleaned = value.replace(/\D/g, "")

    // Ограничиваем длину (11 цифр максимум)
    const digits = cleaned.slice(0, 11)

    if (!digits) return ""

    // Форматируем номер
    if (digits.length === 1) {
      return `+7`
    } else if (digits.length <= 4) {
      return `+7 (${digits.slice(1)}`
    } else if (digits.length <= 7) {
      return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`
    } else if (digits.length <= 9) {
      return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
    } else {
      return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value

    // Если пользователь удаляет символы, разрешаем это
    if (input.length < phone.length) {
      setPhone(input)
      return
    }

    const formatted = formatPhoneNumber(input)
    setPhone(formatted)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Разрешаем: backspace, delete, tab, escape, enter, стрелки
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key === "Enter" ||
      e.key.includes("Arrow") ||
      e.key === "Home" ||
      e.key === "End"
    ) {
      return
    }

    // Запрещаем все, кроме цифр
    if (!/\d/.test(e.key)) {
      e.preventDefault()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")
    const formatted = formatPhoneNumber(pastedData)
    setPhone(formatted)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    // Добавляем отформатированный телефон в formData
    const phoneInput = e.currentTarget.querySelector("#phone") as HTMLInputElement
    if (phoneInput) {
      formData.set("phone", phone)
    }

    const result = await submitJobApplication(formData)

    setIsSubmitting(false)

    if (result.success) {
      setMessage({ type: "success", text: "Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время." })
      ;(e.target as HTMLFormElement).reset()
      setPhone("") // Сбрасываем телефон
      setConsent(false)
    } else {
      setMessage({ type: "error", text: result.error || "Произошла ошибка при отправке заявки" })
    }
  }

  const benefits = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Удаленная работа",
      description: "Работайте из любой точки России",
    },
    {
      icon: <RussianRubleIcon className="w-6 h-6" />,
      title: "Высокий доход",
      description: "Оплата % от продаж без ограничений",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Гибкий график",
      description: "Планируйте свое рабочее время",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Обучение",
      description: "Полное обучение продукту и продажам",
    },
  ]

  const requirements = [
    "Возраст: 18-35 лет",
    "Пол: Женский",
    "Опыт работы в продажах приветствуется",
    "Коммуникабельность и нацеленность на результат",
    "Умение работать с CRM-системами",
    "Знание основ делового общения",
  ]

  const responsibilities = [
    "Поиск и привлечение новых клиентов",
    "Общение с руководителями компаний",
    "Презентация спецтехники и оборудования",
    "Консультирование клиентов по характеристикам техники",
    "Ведение переговоров и заключение сделок",
    "Сопровождение клиентов на всех этапах сделки",
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
            <Briefcase className="w-5 h-5" />
            <span className="font-semibold">Открытые вакансии</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Присоединяйтесь к команде ООО АСТС</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Мы ищем талантливых менеджеров по продажам спецтехники для развития нашего бизнеса
          </p>
        </motion.div>

        {/* Job Posting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <Card className="border-2 border-blue-100">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Менеджер по продажам спецтехники</h2>
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Россия (удаленно)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Полная занятость
                    </span>
                    <span className="flex items-center gap-1">
                      <RussianRubleIcon className="w-4 h-4" />% от продаж
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">О вакансии</h3>
                  <p className="text-gray-600 leading-relaxed">
                    ООО АСТС - ведущий поставщик строительной спецтехники из Китая. Мы ищем амбициозных менеджеров по
                    продажам для работы с корпоративными клиентами. Вы будете предлагать качественную спецтехнику
                    (экскаваторы Komatsu, бульдозеры, погрузчики) руководителям строительных и горнодобывающих компаний.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Требования</h3>
                  <ul className="space-y-2">
                    {requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Обязанности</h3>
                  <ul className="space-y-2">
                    {responsibilities.map((resp, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Условия работы</h3>
                  <div className="bg-blue-50 rounded-lg p-6">
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start gap-2">
                        <RussianRubleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Оплата:</strong> Процент от продаж (от 3% до 7% в зависимости от объема)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Формат:</strong> Полностью удаленная работа из любого города России
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>График:</strong> Гибкий график работы, планируйте время самостоятельно
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>
                          <strong>Обучение:</strong> Полное обучение продукту, техникам продаж и работе с CRM
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Преимущества работы с нами</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-2 hover:border-blue-200 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 text-blue-600">
                    {benefit.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Часто задаваемые вопросы</h2>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">Нужен ли опыт работы в продажах?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Опыт работы в продажах приветствуется, но не обязателен. Мы предоставляем полное обучение нашему
                продукту и техникам продаж. Главное - ваше желание развиваться и достигать результатов.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">Как происходит оплата труда?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Оплата производится в виде процента от каждой успешной продажи. Процент варьируется от 3% до 7% в
                зависимости от объема продаж. Чем больше вы продаете, тем выше ваш процент. Выплаты производятся два
                раза в месяц.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                Какое оборудование нужно для работы?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Для работы вам понадобится компьютер или ноутбук, стабильный интернет и телефон. Все необходимое
                программное обеспечение (CRM-система, мессенджеры) мы предоставляем бесплатно.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">Как проходит обучение?</AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Обучение проходит онлайн в течение первых двух недель. Вы изучите характеристики нашей спецтехники,
                техники продаж, работу с CRM-системой и ведение переговоров. После обучения вас будет сопровождать
                наставник в течение первого месяца работы.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border rounded-lg px-6">
              <AccordionTrigger className="text-lg font-semibold">
                Сколько времени занимает рабочий день?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                График работы гибкий. Вы сами планируете свое рабочее время. Рекомендуемая нагрузка - 6-8 часов в день,
                5 дней в неделю. Однако вы можете работать больше или меньше в зависимости от ваших целей и
                возможностей.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>

        {/* Application Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-2 border-blue-100">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Откликнуться на вакансию</h2>
                <p className="text-gray-600">Заполните форму, и мы свяжемся с вами в ближайшее время</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Ваше имя *
                  </label>
                  <Input id="name" name="name" type="text" required placeholder="Введите ваше имя" className="w-full" />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Телефон *
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                    Город проживания *
                  </label>
                  <Input id="city" name="city" type="text" required placeholder="Москва" className="w-full" />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-2">
                    Возраст *
                  </label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    required
                    placeholder="25"
                    min="18"
                    max="35"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 mb-2">
                    Опыт работы в продажах
                  </label>
                  <Textarea
                    id="experience"
                    name="experience"
                    placeholder="Расскажите о вашем опыте работы в продажах (если есть)"
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Дополнительная информация
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Расскажите о себе, почему вы хотите работать с нами"
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="consent-vacancy"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="consent-vacancy" className="text-sm text-gray-700 leading-relaxed">
                    Оставляя заявку, вы соглашаетесь на обработку персональных данных, условия пользовательского
                    соглашения, получение информации об акциях, ценах и скидках от ООО «АСТС».
                  </label>
                </div>

                {message && (
                  <div
                    className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                  >
                    {message.text}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !consent}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                >
                  {isSubmitting ? "Отправка..." : "Отправить заявку"}
                </Button>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Контакты для связи</h3>
                <div className="space-y-3">
                  <a href="tel:+79190422492" className="flex items-center gap-3 text-gray-600 hover:text-blue-600">
                    <Phone className="w-5 h-5" />
                    <span>+7 (919) 042-24-92</span>
                  </a>
                  <a
                    href="mailto:zhukovigor@yandex.ru"
                    className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
                  >
                    <Mail className="w-5 h-5" />
                    <span>zhukovigor@yandex.ru</span>
                  </a>
                  <a
                    href="https://t.me/zhukovigor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
                  >
                    <Send className="w-5 h-5" />
                    <span>Telegram: @zhukovigor</span>
                  </a>
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
