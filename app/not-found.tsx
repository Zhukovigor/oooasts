import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Страница не найдена | ООО АСТС",
  description: "Запрашиваемая страница не найдена. Вернитесь на главную страницу ООО АСТС - поставщика спецтехники из Китая.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="text-center max-w-2xl w-full">
        {/* Декоративный элемент */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-orange-100 rounded-full opacity-50 blur-xl"></div>
        
        {/* Основной контент */}
        <div className="relative z-10">
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-black text-gray-900 mb-4 tracking-tight">404</h1>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
              Страница не найдена
            </h2>
            <p className="text-base md:text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              К сожалению, запрашиваемая страница не существует или была перемещена.
            </p>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/" className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Вернуться на главную
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/katalog" className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Каталог техники
              </Link>
            </Button>
          </div>

          {/* Популярные разделы */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-6 font-medium">Популярные разделы:</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {[
                { href: "/katalog/ekskavatory", label: "Экскаваторы" },
                { href: "/katalog/avtobetonanosy", label: "Бетононасосы" },
                { href: "/obyavleniya", label: "Объявления" },
                { href: "/v-lizing", label: "Лизинг" },
                { href: "/o-nas", label: "О компании" },
                { href: "/#application", label: "Заявка" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-blue-50"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Дополнительная информация */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Нужна помощь?{" "}
              <Link href="/contacts" className="font-semibold underline hover:no-underline">
                Свяжитесь с нами
              </Link>{" "}
              или позвоните по телефону{" "}
              <a href="tel:+79190422492" className="font-semibold hover:underline">
                +7 (919) 042-24-92
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
