"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Youtube, MessageCircle, Send, MapPin, Mail, Phone, Building, FileText, Shield } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { submitLead } from "@/app/actions/submit-lead"
import { FooterCatalogMenu } from "./footer-catalog-menu"

// Schema.org микроразметка для футера
const footerSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ООО АСТС",
  "alternateName": "ASTS",
  "url": "https://asts.vercel.app",
  "logo": "https://asts.vercel.app/images/logo.png",
  "description": "ООО АСТС - профессиональный поставщик спецтехники от ведущих производителей. Продажа, лизинг и обслуживание строительной техники.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "RU",
    "addressRegion": "Россия"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+7-919-042-24-92",
    "email": "zhukovigor@yandex.ru",
    "contactType": "customer service",
    "areaServed": "RU",
    "availableLanguage": ["Russian", "Chinese"]
  },
  "sameAs": [
    "https://www.youtube.com/@oooasts",
    "https://vk.com/oooasts",
    "https://dzen.ru/oooasts",
    "https://www.tiktok.com/@spec.tehnikaa",
    "https://www.linkedin.com/in/zhukovigor"
  ]
}

export default function Footer() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false)
  const [newsletterMessage, setNewsletterMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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

  async function handleNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setNewsletterSubmitting(true)
    setNewsletterMessage(null)

    try {
      // Здесь будет реальный API вызов
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setNewsletterMessage({ 
        type: "success", 
        text: "Спасибо за подписку! Вы будете получать актуальные предложения." 
      })
      setNewsletterEmail("")
    } catch (error) {
      setNewsletterMessage({ 
        type: "error", 
        text: "Произошла ошибка при подписке. Попробуйте позже." 
      })
    } finally {
      setNewsletterSubmitting(false)
    }
  }

  const navigationLinks = [
    { name: "Главная", href: "/", title: "Перейти на главную страницу" },
    { name: "Купить экскаватор", href: "/buy-excavators", title: "Купить экскаватор" },
    { name: "Каталог Komatsu", href: "/komatsu", title: "Каталог техники Komatsu" },
    { name: "Komatsu PC200", href: "/komatsu-pc200", title: "Экскаватор Komatsu PC200" },
    { name: "Лизинг техники", href: "/leasing", title: "Лизинг спецтехники" },
    { name: "Вакансии", href: "/vacancies", title: "Вакансии в компании" },
    { name: "Объявления", href: "/ads", title: "Объявления о продаже техники" },
    { name: "Статьи", href: "/articles", title: "Статьи о спецтехнике" },
    { name: "Оставить заявку", href: "/#application", title: "Оставить заявку на технику" },
    { name: "Отзывы", href: "/#testimonials", title: "Отзывы клиентов" },
    { name: "Контакты", href: "/#contacts", title: "Контакты компании" }
  ]

  const legalLinks = [
    { 
      name: "Политика обработки данных", 
      href: "/privacy-policy", 
      icon: Shield,
      title: "Политика конфиденциальности"
    },
    { 
      name: "Пользовательское соглашение", 
      href: "/terms-of-use", 
      icon: FileText,
      title: "Условия использования сайта"
    },
    { 
      name: "Реквизиты компании", 
      href: "/company-details", 
      icon: Building,
      title: "Реквизиты ООО АСТС"
    }
  ]

  const socialLinks = [
    {
      name: "YouTube",
      href: "https://www.youtube.com/@oooasts",
      icon: Youtube,
      color: "hover:bg-[#CC0000]",
      bgColor: "bg-[#FF0000]",
      ariaLabel: "YouTube канал ООО АСТС"
    },
    {
      name: "ВКонтакте",
      href: "https://vk.com/oooasts",
      icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.15 14.31h-1.34c-.53 0-.69-.42-1.65-1.39-.83-.82-1.2-.93-1.41-.93-.29 0-.37.08-.37.47v1.27c0 .34-.11.54-1 .54-1.47 0-3.1-.89-4.25-2.55-1.72-2.37-2.19-4.16-2.19-4.52 0-.21.08-.4.47-.4z" />
        </svg>
      ),
      color: "hover:bg-[#0066DD]",
      bgColor: "bg-[#0077FF]",
      ariaLabel: "Страница ВКонтакте"
    },
    {
      name: "Яндекс Дзен",
      href: "https://dzen.ru/oooasts",
      icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.853 3a10 10 0 10.294 20 10 10 0 00-.294-20zm-3.706 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-8.47 7.348a1 1 0 01-.884-1.47 1 1 0 011.768 0 1 1 0 01-.884 1.47zm9.412 0a1 1 0 01-.884-1.47 1 1 0 011.768 0 1 1 0 01-.884 1.47z" />
        </svg>
      ),
      color: "hover:bg-gray-700",
      bgColor: "bg-gray-900",
      ariaLabel: "Канал в Яндекс Дзен"
    },
    {
      name: "TikTok",
      href: "https://www.tiktok.com/@spec.tehnikaa",
      icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.37 2h2.6c.09 2.9 1.74 4.29 4.13 4.53v2.12c-.87-.09-1.7-.29-2.41-.61v7.15c0 2.45-1.56 4.08-4.07 4.08-2.51 0-4.03-1.63-4.03-4.08 0-2.41 1.46-3.98 3.67-4.08v2a2.04 2.04 0 00-1.62 2.05c0 1.15.84 2.07 2.03 2.07 1.16 0 1.97-.69 1.97-2.1v-11z" />
        </svg>
      ),
      color: "hover:bg-[#222]",
      bgColor: "bg-[#000]",
      ariaLabel: "Аккаунт в TikTok"
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/zhukovigor",
      icon: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      color: "hover:bg-[#004182]",
      bgColor: "bg-[#0A66C2]",
      ariaLabel: "Профиль в LinkedIn"
    }
  ]

  return (
    <>
      {/* Schema.org микроразметка */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(footerSchema) }}
      />

      <footer 
        className="relative bg-white border-t border-gray-200"
        role="contentinfo"
        aria-label="Подвал сайта"
      >
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-grid-subtle opacity-20 pointer-events-none" />

        <div className="container mx-auto px-6 py-16 relative z-10">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-50px" }}
              className="lg:col-span-2"
              itemScope
              itemType="https://schema.org/Organization"
            >
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/logo.png"
                  alt="АСТС Логотип - поставщик спецтехники"
                  width={60}
                  height={60}
                  className="bg-white rounded-lg p-1"
                  itemProp="logo"
                />
                <div>
                  <h3 
                    className="font-black tracking-wider text-gray-900 font-mono text-3xl"
                    itemProp="name"
                  >
                    ООО «АСТС»
                  </h3>
                  <p className="text-sm text-gray-600 mt-1" itemProp="description">
                    Поставщик строительной спецтехники
                  </p>
                </div>
              </div>
              
              <p 
                className="text-lg text-gray-600 leading-relaxed mb-6 max-w-md text-justify"
                itemProp="description"
              >
                ООО «АСТС» – динамично развивающийся поставщик строительной спецтехники, 
                горно-шахтного оборудования, машин и механизмов. Мы ориентированы на современные 
                рыночные решения и потребности наших клиентов. Сделать приобретение техники 
                максимально простым, выгодным и безопасным для вашего бизнеса.
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 ${social.bgColor} ${social.color} text-white rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110`}
                    aria-label={social.ariaLabel}
                    itemProp="sameAs"
                  >
                    {typeof social.icon === 'function' ? <social.icon /> : social.icon}
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <h4 className="text-xl font-bold text-gray-900 mb-6 tracking-wide">
                НАВИГАЦИЯ
              </h4>
              <nav aria-label="Основная навигация">
                <ul className="space-y-3">
                  {navigationLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium block py-1"
                        title={link.title}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </motion.div>

            {/* Catalog Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <FooterCatalogMenu />
            </motion.div>

            {/* Contacts & Newsletter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true, margin: "-50px" }}
              itemScope
              itemType="https://schema.org/ContactPoint"
            >
              <h4 className="text-xl font-bold text-gray-900 mb-6 tracking-wide">
                КОНТАКТЫ
              </h4>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <MapPin size={18} className="text-gray-600 flex-shrink-0" />
                  <span className="text-gray-600 font-medium" itemProp="areaServed">
                    Россия
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail size={18} className="text-gray-600 flex-shrink-0" />
                  <a
                    href="mailto:zhukovigor@yandex.ru"
                    className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium break-all"
                    itemProp="email"
                  >
                    zhukovigor@yandex.ru
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone size={18} className="text-gray-600 flex-shrink-0" />
                  <a
                    href="tel:+79190422492"
                    className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
                    itemProp="telephone"
                  >
                    +7 (919) 042-24-92
                  </a>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <a
                    href="https://wa.me/79190422492"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-[#25D366] transition-colors duration-300 font-medium"
                  >
                    <MessageCircle size={18} />
                    Написать в WhatsApp
                  </a>
                  <a
                    href="https://t.me/zhukovigor"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-[#0088cc] transition-colors duration-300 font-medium"
                  >
                    <Send size={18} />
                    Написать в Telegram
                  </a>
                </div>
              </div>

              {/* Newsletter Subscription */}
              <div className="pt-8 border-t border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-4 tracking-wide">
                  РАССЫЛКА
                </h4>
                <p className="text-gray-600 mb-4 text-sm">
                  Получайте первыми актуальные предложения и новости о спецтехнике
                </p>
                
                <form 
                  onSubmit={handleNewsletterSubscribe}
                  className="space-y-3"
                  aria-label="Форма подписки на рассылку"
                >
                  <div className="relative">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Ваш email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      aria-required="true"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={newsletterSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    {newsletterSubmitting ? "Подписываем..." : "Подписаться на новости"}
                  </button>
                  
                  {newsletterMessage && (
                    <p 
                      className={`text-sm font-medium ${
                        newsletterMessage.type === "success" ? "text-green-600" : "text-red-600"
                      }`}
                      role="alert"
                    >
                      {newsletterMessage.text}
                    </p>
                  )}
                </form>
              </div>
            </motion.div>
          </div>

          {/* Bottom Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true, margin: "-50px" }}
            className="border-t border-gray-200 pt-8"
          >
            {/* Legal Links */}
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-6">
              <div className="flex flex-wrap justify-center gap-6">
                {legalLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium text-sm"
                    title={link.title}
                  >
                    <link.icon size={16} />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-600 font-medium text-center md:text-left">
                Copyright © 2025-{new Date().getFullYear()} ООО «АСТС». Все права защищены.
                <br className="sm:hidden" />
                <span className="hidden sm:inline"> • </span>
                ИНН: 6700037092 • ОГРН: 1156733004978
              </p>

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
