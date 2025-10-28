"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "Сколько стоит экскаватор Komatsu PC200?",
      answer:
        "Стоимость экскаватора Komatsu PC200 зависит от года выпуска, состояния и комплектации. Новые модели начинаются от 10-15 млн рублей, б/у техника в хорошем состоянии - от 6-7 млн рублей. Для точного расчета стоимости с учетом доставки и растаможки свяжитесь с нашими специалистами.",
    },
    {
      question: "Как купить экскаватор Komatsu с доставкой?",
      answer:
        "Процесс покупки простой: 1) Свяжитесь с нами любым удобным способом (WhatsApp, Telegram, телефон). 2) Наши специалисты помогут подобрать технику под ваши задачи и бюджет. 3) Заключаем договор с указанием всех условий. 4) Организуем доставку из Китая или со склада в РФ. 5) Оформляем все документы, включая растаможку и сертификацию. 6) Передаем технику с полным пакетом документов. Срок доставки: 1-2 недели при наличии на складе в РФ, 20-45 дней при заказе из Китая.",
    },
    {
      question: "Какие документы нужны для покупки спецтехники из Китая?",
      answer:
        "Для покупки спецтехники потребуются: договор купли-продажи, инвойс, паспорт транспортного средства (ПТС), сертификат соответствия, таможенная декларация. Мы берем на себя все вопросы документального оформления и предоставляем полный пакет документов с НДС.",
    },
    {
      question: "��ем отличается Komatsu PC200 от PC300?",
      answer:
        "Основные отличия: PC200 весит 19-21 тонну с мощностью 148 л.с. и ковшом 0.8-1.0 м³, подходит для универсальных работ. PC300 весит 28-31 тонну с мощностью 220 л.с. и ковшом 1.2-1.6 м³, предназначен для более тяжелых работ и крупных проектов. PC300 имеет большую производительность, но и стоит дороже (на 40-50%). Выбор зависит от масштаба ваших задач и бюджета.",
    },
    {
      question: "Есть ли гарантия на технику из Китая?",
      answer:
        "Да, на новую технику предоставляется гарантия производителя сроком от 1 года. На б/у технику мы проводим тщательную предпродажную проверку и можем предоставить гарантию на основные узлы и агрегаты. Все условия гарантии прописываются в договоре.",
    },
    {
      question: "Сколько времени занимает доставка экскаватора из Китая?",
      answer:
        "Срок доставки зависит от наличия техники на складе и способа транспортировки. При наличии на складе в РФ - 1-2 недели. При заказе из Китая морским транспортом - 30-45 дней, железнодорожным - 20-30 дней. Мы информируем клиента на каждом этапе доставки.",
    },
    {
      question: "Можно ли купить экскаватор в лизинг?",
      answer:
        "Да, мы работаем с ведущими лизинговыми компаниями России. Можем помочь оформить лизинг на выгодных условиях с первоначальным взносом от 10%. Наши специалисты помогут подобрать оптимальную программу финансирования под ваши задачи.",
    },
    {
      question: "Какая разница между новым и б/у экскаватором Komatsu?",
      answer:
        "Новый экскаватор имеет полную заводскую гарантию, максимальный ресурс и современные технологии. Б/у техника стоит значительно дешевле (на 40-60%), при этом качественные японские экскаваторы Komatsu сохраняют высокую работоспособность даже после многих лет эксплуатации. Мы тщательно проверяем каждую единицу б/у техники перед продажей.",
    },
    {
      question: "Есть ли в наличии запчасти для экскаваторов Komatsu?",
      answer:
        "Да, мы можем поставить оригинальные и качественные аналоговые запчасти для всех моделей Komatsu. Наиболее востребованные запчасти есть на складе в России. Редкие детали заказываем из Китая со сроком доставки 15-30 дней. Также предоставляем консультации по техническому обслуживанию и ремонту.",
    },
  ]

  return (
    <section id="faq" className="relative py-20 bg-white">
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-wider mb-6 text-gray-900">ЧАСТЫЕ ВОПРОСЫ</h2>
          <p className="text-xl md:text-2xl text-gray-600">Ответы на популярные вопросы о покупке спецтехники</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                <ChevronDown
                  className={`flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  size={24}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <div className="px-6 pb-4 text-gray-600 leading-relaxed">{faq.answer}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-gray-600">
            Не нашли ответ на свой вопрос?{" "}
            <a href="#join" className="text-gray-900 font-semibold hover:underline">
              Свяжитесь с нами
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
