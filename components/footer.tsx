"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Youtube, MessageCircle, Send, MapPin, Mail, Phone } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { submitLead } from "@/app/actions/submit-lead"
import { FooterCatalogMenu } from "./footer-catalog-menu"

export default function Footer() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await submitLead(formData)

    setIsSubmitting(false)

    if (result.success) {
      setMessage({ type: "success", text: "Спасибо! Мы свяжемся с вами в ближайшее время." })
      ;(e.target as HTMLFormElement).reset()
    } else {
      setMessage({ type: "error", text: result.error || "Произошла ошибка" })
    }
  }

  return (
    <footer className="relative bg-white border-t border-gray-200">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none" />

      <div className="container mx-auto px-6 py-16 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/logo.png"
                alt="АСТС Логотип"
                width={60}
                height={60}
                className="bg-white rounded-lg p-1"
              />
              <h3 className="font-black tracking-wider text-gray-900 font-mono text-3xl">ООО «АСТС»</h3>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed mb-6 max-w-md">
              Поставщик строительной спецтехники, горно-шахтного оборудования, машин и механизмов из Китая. Мы
              предоставляем готовые решения для развития вашего бизнеса.
            </p>

            <div className="flex space-x-4">
              <a
                href="https://www.youtube.com/@oooasts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="YouTube канал"
              >
                <Youtube size={20} />
              </a>
              <a
                href="https://vk.com/oooasts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[#0077FF] hover:bg-[#0066DD] text-white rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="ВКонтакте"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.15 14.31h-1.34c-.53 0-.69-.42-1.65-1.39-.83-.82-1.2-.93-1.41-.93-.29 0-.37.08-.37.47v1.27c0 .34-.11.54-1 .54-1.47 0-3.1-.89-4.25-2.55-1.72-2.37-2.19-4.16-2.19-4.52 0-.21.08-.4.47-.4z" />
                </svg>
              </a>
              <a
                href="https://vkvideo.ru/@oooasts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[#07F] hover:bg-[#0066DD] text-white rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="ВК Видео"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </a>
              <a
                href="https://dzen.ru/oooasts"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gray-900 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="Яндекс Дзен"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#161616" />
                  <path
                    d="M11.9994 1.75a10.25 10.25 0 100 20.5 10.25 10.25 0 000-20.5zm0 1.5a8.75 8.75 0 110 17.5 8.75 8.75 0 010-17.5zm.8003 3.778a.783.783 0 10-1.567 0v2.452a.782.782 0 001.567 0V7.027zm-3.478 2.44a.783.783 0 10-1.107 1.107l1.734 1.734a.782.782 0 001.107-1.107l-1.734-1.734zm7.155 0l-1.733 1.734a.782.782 0 101.107 1.107l1.734-1.734a.783.783 0 10-1.108-1.107zm-3.677 3.915a2.333 2.333 0 100 4.667 2.333 2.333 0 000-4.667zm-.8003 5.24a.782.782 0 10-1.565 0v2.453a.783.783 0 101.565 0v-2.452zm3.478 0v2.452a.783.783 0 101.567 0v-2.452a.782.782 0 10-1.567 0z"
                    fill="#fff"
                  />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@spec.tehnikaa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[#000] hover:bg-[#222] text-white rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="TikTok"
              >
                <svg className="mx-0 my-0 leading-7" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.37 2h2.6c.09 2.9 1.74 4.29 4.13 4.53v2.12c-.87-.09-1.7-.29-2.41-.61v7.15c0 2.45-1.56 4.08-4.07 4.08-2.51 0-4.03-1.63-4.03-4.08 0-2.41 1.46-3.98 3.67-4.08v2a2.04 2.04 0 00-1.62 2.05c0 1.15.84 2.07 2.03 2.07 1.16 0 1.97-.69 1.97-2.1v-11z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/игорь-жуков-3694931a6/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="LinkedIn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-xl font-bold text-gray-900 mb-6 tracking-wide">НАВИГАЦИЯ</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium">
                  Главная
                </Link>
              </li>
              <li>
                <Link
                  href="/buy-excavators"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  Купить экскаватор
                </Link>
              </li>
              <li>
                <Link
                  href="/komatsu"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  Каталог Komatsu
                </Link>
              </li>
              <li>
                <Link
                  href="/komatsu-pc200"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  Komatsu PC200
                </Link>
              </li>
              <li>
                <Link
                  href="/v-lizing"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  В лизинг
                </Link>
              </li>
              <li>
                <Link
                  href="/vakansii"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  Вакансии
                </Link>
              </li>
              <li>
                <Link
                  href="/stati"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  Статьи
                </Link>
              </li>
              <li>
                <Link
                  href="/#application"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  Оставить заявку
                </Link>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  Отзывы
                </a>
              </li>
              <li>
                <a
                  href="#join"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  Контакты
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
          >
            <FooterCatalogMenu />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-xl font-bold text-gray-900 mb-6 tracking-wide">КОНТАКТЫ</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin size={18} className="text-gray-600" />
                <span className="text-gray-600 font-medium">Россия</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-gray-600" />
                <a
                  href="mailto:zhukovigor@yandex.ru"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  zhukovigor@yandex.ru
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-gray-600" />
                <a
                  href="tel:+79190422492"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                >
                  +7 (919) 042-24-92
                </a>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <a
                  href="https://wa.me/79190422492"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-[#25D366] transition-colors duration-300 font-medium"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </a>
                <a
                  href="https://t.me/zhukovigor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-[#0088cc] transition-colors duration-300 font-medium"
                >
                  <Send size={18} />
                  Telegram
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {/* Additional content can be added here if needed */}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
        >
          <p className="text-gray-600 font-medium">{"Copyright© 2025 г. Все права защищены. «ООО АСТС» ИНН: 6700037092"}</p>

          <div className="flex space-x-6">
            <Link
              href="/politika-obrabotki-dannyh"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
            >
              Политика обработки данных
            </Link>
            <Link
              href="/o-faylah-cookie"
              className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
            >
              О файлах cookie
            </Link>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium">
              Условия использования
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-8 pt-6 border-t border-gray-200"
        >
          <p className="text-sm text-gray-500 text-center leading-relaxed max-w-4xl mx-auto">
            Информация, размещенная на сайте, носит информационный характер и не является публичной офертой согласно
            статье 437 ГК РФ. ООО «АСТС» оставляет за собой право в одностороннем порядке и без уведомления вносить
            изменения, удалять, исправлять, дополнять, либо иным способом обновлять информацию на сайте.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
