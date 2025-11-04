"use client"

import { LiquidButton } from "@/components/ui/liquid-glass-button"
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Phone,
  MapPin,
  Clock,
  Search,
  Heart,
  ShoppingCart,
} from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { createBrowserClient } from "@supabase/ssr"

interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  image_url: string
  image_alt: string | null
  button_text: string
  button_link: string
  button_visible: boolean
  button_color: string
  button_text_color: string
  title_font_size: string
  title_font_weight: string
  title_color: string
  title_alignment: string
  subtitle_font_size: string
  subtitle_font_weight: string
  subtitle_color: string
  content_position: string
  content_alignment: string
  overlay_opacity: number
  overlay_color: string
  sort_order: number
  is_active: boolean
  auto_rotate_seconds: number
}

// Schema.org микроразметка для организации
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ООО АСТС",
  "alternateName": "ASTS",
  "url": "https://asts.vercel.app",
  "logo": "https://asts.vercel.app/images/logo.png",
  "description": "ООО АСТС - поставщик спецтехники от ведущих производителей. Продажа, лизинг и обслуживание строительной техники.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": ["RU", "CN"]
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+7-919-042-24-92",
    "contactType": "customer service",
    "areaServed": ["RU", "CN"],
    "availableLanguage": ["Russian", "Chinese"]
  },
  "sameAs": [],
  "areaServed": ["Россия", "Китай"]
}

// Schema.org для веб-сайта
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ООО АСТС - Спецтехника",
  "url": "https://asts.vercel.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://asts.vercel.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}

export default function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchSlides = async () => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

      if (error) {
        console.error("Error fetching hero slides:", error)
      } else if (data && data.length > 0) {
        setSlides(data)
      }
    }

    fetchSlides()
    setMounted(true)
  }, [])

  useEffect(() => {
    if (slides.length === 0) return

    const autoRotateSeconds = slides[currentSlide]?.auto_rotate_seconds || 15

    if (autoRotateSeconds === 0) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, autoRotateSeconds * 1000)

    return () => clearInterval(interval)
  }, [currentSlide, slides])

  // Семантическая навигационная структура
  const navItems = [
    { name: "Главная", href: "/", role: "navigation" },
    { name: "Преимущества", href: "#advantages", role: "navigation" },
    { name: "Отзывы", href: "#testimonials", role: "navigation" },
    { name: "В лизинг", href: "/v-lizing", role: "navigation" },
    { name: "Вакансии", href: "/vakansii", role: "navigation" },
    { name: "Статьи", href: "/stati", role: "navigation" },
    { name: "Контакты", href: "#contacts", role: "navigation" },
  ]

  const categoryItems = [
    {
      name: "КАТАЛОГ",
      href: "/katalog",
      role: "navigation",
      submenu: [
        { name: "Автобетононасосы", href: "/katalog/avtobetonanosy" },
        { name: "Экскаваторы", href: "/katalog/ekskavatory" },
        { name: "Бульдозеры", href: "/katalog/buldozery" },
        { name: "Автогрейдеры", href: "/katalog/avtogreydery" },
        { name: "Компакторы", href: "/katalog/kompaktory" },
        { name: "Трубоукладчики", href: "/katalog/truboukladchiki" },
        { name: "Дорожные катки", href: "/katalog/dorozhnye-katki" },
        { name: "Фронтальные погрузчики", href: "/katalog/frontalnye-pogruzchiki" },
        { name: "Седельные тягачи", href: "/katalog/sedelnye-tyagachi" },
        { name: "Автобетоносмесители", href: "/katalog/avtobetonosmesiteli" },
        { name: "Автокраны", href: "/katalog/avtokrany" },
        { name: "Эвакуаторы", href: "/katalog/evakuatory" },
        { name: "Лестовозы", href: "/katalog/lesovozy" },
        { name: "Сортиментовозы", href: "/katalog/sortimentovozy" },
        { name: "Тралы", href: "/katalog/traly" },
        { name: "Полуприцепы", href: "/katalog/polupritsepy" },
        { name: "Автовышки", href: "/katalog/avtovyshki" },
        { name: "Рефрижераторы", href: "/katalog/refrizheratory" },
        { name: "Краны-манипуляторы", href: "/katalog/krany-manipulyatory" },
        { name: "Автовозы", href: "/katalog/avtovozy" },
      ],
    },
    {
      name: "О КОМПАНИИ",
      href: "/o-nas",
      role: "navigation",
      submenu: [{ name: "О нас", href: "/o-nas" }],
    },
    {
      name: "ТЕХНИКА",
      href: "/technika",
      role: "navigation",
      submenu: [
        { name: "Каталог Komatsu", href: "/komatsu" },
        { name: "Komatsu PC200", href: "/komatsu-pc200" },
        { name: "Купить экскаватор", href: "/buy-excavators" },
        { name: "Автобетононасосы", href: "/katalog/avtobetonanosy" },
        { name: "Техника с пробегом", href: "/used-equipment", isSubmenuTitle: true },
        { name: "Б/У экскаваторы", href: "/buy-excavators" },
        { name: "Б/У спецтехника", href: "/komatsu" },
      ],
    },
    {
      name: "ЛИЗИНГ",
      href: "/v-lizing",
      role: "navigation",
    },
    {
      name: "СПЕЦПРЕДЛОЖЕНИЯ",
      href: "/specpredlozheniya",
      role: "navigation",
      submenu: [
        { name: "Акции", href: "/aktsii" },
        { name: "Скидки", href: "/skidki" },
      ],
    },
    {
      name: "СТАТЬИ",
      href: "/stati",
      role: "navigation",
    },
    {
      name: "ОБЪЯВЛЕНИЯ",
      href: "/obyavleniya",
      role: "navigation",
    },
  ]

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
    setIsMenuOpen(false)
    setOpenSubmenu(null)
  }

  const handleSubmenuToggle = (menuName: string) => {
    setOpenSubmenu(openSubmenu === menuName ? null : menuName)
  }

  const handleSubmenuMouseEnter = (menuName: string) => {
    if (mounted) {
      setOpenSubmenu(menuName)
    }
  }

  const handleSubmenuMouseLeave = () => {
    if (mounted) {
      setOpenSubmenu(null)
    }
  }

  const currentSlideData = slides.length > 0 ? slides[currentSlide] : {
    id: "default",
    title: "КУПИТЬ СПЕЦТЕХНИКУ",
    subtitle: "Широкий выбор техники от ведущих производителей",
    image_url: "/images/design-mode/maps.jpg",
    image_alt: "Спецтехника - ООО АСТС",
    button_text: "ОСТАВИТЬ ЗАЯВКУ",
    button_link: "#application",
    button_visible: true,
    button_color: "#2563eb",
    button_text_color: "#ffffff",
    title_font_size: "5xl",
    title_font_weight: "bold",
    title_color: "#ffffff",
    title_alignment: "left",
    subtitle_font_size: "xl",
    subtitle_font_weight: "medium",
    subtitle_color: "#ffffff",
    content_position: "center",
    content_alignment: "left",
    overlay_opacity: 0.4,
    overlay_color: "#000000",
    sort_order: 0,
    is_active: true,
    auto_rotate_seconds: 15,
  }

  // Микроразметка для слайдера
  const sliderSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Слайды спецтехники",
    "numberOfItems": slides.length,
    "itemListElement": slides.map((slide, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "CreativeWork",
        "name": slide.title,
        "description": slide.subtitle,
        "image": slide.image_url
      }
    }))
  }

  return (
    <>
      {/* Schema.org микроразметка */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {slides.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sliderSchema) }}
        />
      )}

      <header 
        id="hero" 
        className="relative h-screen w-full overflow-hidden bg-black"
        itemScope
        itemType="https://schema.org/WPHeader"
        role="banner"
      >
        {/* Background Image with semantic meaning */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
          style={{ backgroundImage: `url('${currentSlideData.image_url}')` }}
          role="img"
          aria-label={currentSlideData.image_alt || "Спецтехника ООО АСТС"}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: currentSlideData.overlay_color,
              opacity: currentSlideData.overlay_opacity,
            }}
          />
        </div>

        {/* Top Info Bar with contact information */}
        <div 
          className="relative z-20 bg-gray-100 border-b border-gray-200"
          itemScope
          itemType="https://schema.org/ContactPoint"
        >
          <div className="container mx-auto px-6 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-700 px-2.5">
                <MapPin size={16} />
                <span className="font-medium" itemProp="areaServed">КИТАЙ · РОССИЯ</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-gray-700">
                <Clock size={16} />
                <time className="font-medium" itemProp="hoursAvailable">
                  Время работы: с 08:00 до 21:00 по Москве
                </time>
              </div>
              <a
                href="https://wa.me/79190422492"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors mx-2.5"
                itemProp="url"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span className="font-medium">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav 
          className="relative z-20 bg-white border-b border-gray-200"
          aria-label="Основная навигация"
          itemScope
          itemType="https://schema.org/SiteNavigationElement"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Hamburger + Logo */}
              <div className="flex items-center gap-4">
                <button
                  className="md:hidden text-gray-900 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label="Переключить меню"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <Link 
                  href="/" 
                  className="flex items-center gap-3"
                  itemProp="url"
                  aria-label="Перейти на главную страницу"
                >
                  <div itemScope itemType="https://schema.org/Organization">
                    <Image
                      src="/images/logo.png"
                      alt="АСТС Логотип - поставщик спецтехники"
                      width={50}
                      height={50}
                      className="bg-white rounded-lg p-1"
                      itemProp="logo"
                    />
                  </div>
                  <div className="hidden md:block">
                    <div className="text-gray-900 text-xl tracking-wider font-extrabold" itemProp="name">
                      ООО АСТС
                    </div>
                    <div className="text-gray-600 text-xs" itemProp="description">
                      Поставщик техники
                    </div>
                  </div>
                </Link>
              </div>

              {/* Center: USP Badge + Navigation */}
              <div className="hidden lg:flex items-center gap-8">
                <div 
                  className="bg-blue-600 text-white px-4 py-2 text-sm font-bold whitespace-nowrap rounded-sm"
                  role="complementary"
                  aria-label="Уникальное торговое предложение"
                >
                  Мы превосходим все ваши ожидания
                </div>

                <nav aria-label="Основные разделы сайта">
                  <ul className="flex items-center space-x-6">
                    {navItems.slice(0, 5).map((item) => {
                      if (item.submenu) {
                        const isOpen = mounted && openSubmenu === item.name
                        return (
                          <li key={item.name} className="relative group">
                            <button 
                              className="text-gray-900 hover:text-blue-600 transition-colors font-medium flex items-center gap-1 py-2"
                              onClick={() => handleSubmenuToggle(item.name)}
                              aria-expanded={isOpen}
                              aria-haspopup="true"
                            >
                              {item.name}
                              <ChevronDown
                                size={16}
                                className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                              />
                            </button>

                            {isOpen && (
                              <ul 
                                className="absolute top-full left-0 w-56 bg-white rounded-lg shadow-xl overflow-hidden z-50"
                                role="menu"
                                aria-label={`Подменю ${item.name}`}
                              >
                                {item.submenu.map((subItem) => (
                                  <li key={subItem.name} role="none">
                                    <Link
                                      href={subItem.href}
                                      className="block px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200 font-medium"
                                      role="menuitem"
                                      onClick={() => setOpenSubmenu(null)}
                                    >
                                      {subItem.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        )
                      }

                      return (
                        <li key={item.name}>
                          {item.href.startsWith("#") ? (
                            <button
                              onClick={() => scrollToSection(item.href)}
                              className="text-gray-900 hover:text-blue-600 transition-colors font-medium"
                              role="button"
                            >
                              {item.name}
                            </button>
                          ) : (
                            <Link
                              href={item.href}
                              className="text-gray-900 hover:text-blue-600 transition-colors font-medium"
                              itemProp="url"
                            >
                              <span itemProp="name">{item.name}</span>
                            </Link>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </nav>
              </div>

              {/* Right: Phone + CTA Button */}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right" itemScope itemType="https://schema.org/ContactPoint">
                  <a
                    href="tel:+79190422492"
                    className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors font-bold text-lg"
                    itemProp="telephone"
                  >
                    <Phone size={20} className="text-blue-600" />
                    +7 (919) 042-24-92
                  </a>
                  <a 
                    href="tel:+79107219400" 
                    className="text-gray-600 text-sm hover:text-blue-600 transition-colors"
                    itemProp="telephone"
                  >
                    +7 (910) 721-94-00
                  </a>
                </div>

                <button
                  onClick={() => scrollToSection("#application")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
                  aria-label="Оставить заявку на спецтехнику"
                >
                  Оставить заявку
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Bottom Category Navigation */}
        <nav 
          className="relative z-20 bg-white border-b border-gray-200 hidden md:block"
          aria-label="Категории спецтехники"
          itemScope
          itemType="https://schema.org/SiteNavigationElement"
        >
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between py-3">
              <ul className="flex items-center space-x-8">
                {categoryItems.map((item) => {
                  if (item.submenu) {
                    const isOpen = mounted && openSubmenu === item.name
                    return (
                      <li key={item.name} className="relative group">
                        <button
                          className="text-gray-900 hover:text-blue-600 transition-colors font-bold text-sm flex items-center gap-1 py-2"
                          onClick={() => handleSubmenuToggle(item.name)}
                          aria-expanded={isOpen}
                          aria-haspopup="true"
                        >
                          {item.name}
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isOpen && (
                          <ul 
                            className="absolute top-full left-0 w-56 bg-white rounded-lg shadow-xl overflow-hidden z-50"
                            role="menu"
                            aria-label={`Подменю ${item.name}`}
                          >
                            {item.submenu.map((subItem) => (
                              <li key={subItem.name} role="none">
                                <Link
                                  href={subItem.href}
                                  className="block px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200 font-medium"
                                  role="menuitem"
                                  onClick={() => setOpenSubmenu(null)}
                                >
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  }

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-gray-900 hover:text-blue-600 transition-colors font-bold text-sm"
                        itemProp="url"
                      >
                        <span itemProp="name">{item.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <div className="flex items-center space-x-4">
                <button 
                  className="relative text-gray-900 hover:text-blue-600 transition-colors"
                  aria-label="Избранно��"
                >
                  <Heart size={20} />
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    0
                  </span>
                </button>
                <button 
                  className="relative text-gray-900 hover:text-blue-600 transition-colors"
                  aria-label="Корзина"
                >
                  <ShoppingCart size={20} />
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    0
                  </span>
                </button>
                <button 
                  className="text-gray-900 hover:text-blue-600 transition-colors"
                  aria-label="Поиск"
                >
                  <Search size={20} />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        {mounted && isMenuOpen && (
          <nav 
            id="mobile-menu"
            className="absolute top-0 left-0 w-full h-full bg-black/90 z-30 md:hidden overflow-y-auto"
            aria-label="Мобильное меню"
          >
            <div className="flex flex-col items-center justify-center min-h-full space-y-6 py-20">
              {navItems.map((item) => {
                if (item.submenu) {
                  const isOpen = openSubmenu === item.name
                  return (
                    <div key={item.name} className="flex flex-col items-center space-y-4">
                      <button
                        onClick={() => handleSubmenuToggle(item.name)}
                        className="text-white text-2xl font-bold tracking-wider flex items-center gap-2"
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                      >
                        {item.name}
                        <ChevronDown
                          size={20}
                          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {isOpen && (
                        <ul className="flex flex-col items-center space-y-2">
                          {item.submenu.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                href={subItem.href}
                                onClick={() => {
                                  setIsMenuOpen(false)
                                  setOpenSubmenu(null)
                                }}
                                className="text-gray-300 text-lg font-medium tracking-wider hover:text-white transition-colors duration-300 pl-4"
                              >
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                }

                return (
                  item.href.startsWith("#") ? (
                    <button
                      key={item.name}
                      onClick={() => scrollToSection(item.href)}
                      className="text-white text-2xl font-bold tracking-wider hover:text-gray-300 transition-colors duration-300"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-white text-2xl font-bold tracking-wider hover:text-gray-300 transition-colors duration-300"
                    >
                      {item.name}
                    </Link>
                  )
                )
              })}
            </div>
          </nav>
        )}

        {/* Hero Content */}
        <main 
          className={`relative z-10 flex h-full ${
            currentSlideData.content_position === "top"
              ? "items-start"
              : currentSlideData.content_position === "bottom"
                ? "items-end"
                : "items-center"
          } px-6 my-4 py-96 ${
            currentSlideData.content_alignment === "center"
              ? "justify-center"
              : currentSlideData.content_alignment === "right"
                ? "justify-end"
                : "justify-start"
          }`}
          role="main"
          aria-label="Основной контент"
        >
          <div
            className={`max-w-4xl ${
              currentSlideData.content_alignment === "center"
                ? "text-center"
                : currentSlideData.content_alignment === "right"
                  ? "text-right"
                  : "text-left"
            }`}
          >
            <h1
              className={`text-${currentSlideData.title_font_size} font-${currentSlideData.title_font_weight} tracking-wider mb-4 leading-none transition-opacity duration-500 md:text-7xl lg:text-8xl`}
              style={{ color: currentSlideData.title_color }}
              itemProp="headline"
            >
              {currentSlideData.title}
            </h1>

            {currentSlideData.subtitle && (
              <p
                className={`text-${currentSlideData.subtitle_font_size} md:text-2xl font-${currentSlideData.subtitle_font_weight} tracking-wide mb-8 transition-opacity duration-500`}
                style={{ color: currentSlideData.subtitle_color }}
                itemProp="description"
              >
                {currentSlideData.subtitle}
              </p>
            )}

            {currentSlideData.button_visible && (
              <div itemScope itemType="https://schema.org/ContactPoint">
                <LiquidButton
                  size="xxl"
                  className="font-semibold text-lg tracking-wide"
                  style={{
                    backgroundColor: currentSlideData.button_color,
                    color: currentSlideData.button_text_color,
                  }}
                  onClick={() => scrollToSection(currentSlideData.button_link)}
                  aria-label={currentSlideData.button_text}
                >
                  {currentSlideData.button_text}
                </LiquidButton>
              </div>
            )}
          </div>
        </main>

        {/* Slider Navigation - only show if we have multiple slides */}
        {slides.length > 1 && (
          <nav 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
            aria-label="Навигация по слайдам"
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={prevSlide}
                className="text-white hover:text-gray-300 transition-colors p-2"
                aria-label="Предыдущий слайд"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="flex space-x-2" role="tablist" aria-label="Слайды">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      currentSlide === index ? "bg-white" : "bg-white/40 hover:bg-white/60"
                    }`}
                    role="tab"
                    aria-selected={currentSlide === index}
                    aria-label={`Слайд ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="text-white hover:text-gray-300 transition-colors p-2"
                aria-label="Следующий слайд"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </nav>
        )}

        {/* Side Navigation Indicators - only show if we have multiple slides */}
        {slides.length > 1 && (
          <nav 
            className="absolute right-8 top-1/2 transform -translate-y-1/2 z-20 hidden md:block"
            aria-label="Вертикальная навигация по слайдам"
          >
            <div className="flex flex-col space-y-3" role="tablist">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-1 h-8 transition-all duration-300 ${
                    currentSlide === index ? "bg-white" : "bg-white/40 hover:bg-white/60"
                  }`}
                  role="tab"
                  aria-selected={currentSlide === index}
                  aria-label={`Слайд ${index + 1}`}
                />
              ))}
            </div>
          </nav>
        )}
      </header>
    </>
  )
}
