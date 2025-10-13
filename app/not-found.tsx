import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center px-4">
        <h1 className="text-9xl font-black text-gray-900 mb-4">404</h1>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Страница не найдена</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          К сожалению, запрашиваемая страница не существует или была перемещена.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">Вернуться на главную</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/komatsu">Каталог техники</Link>
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Популярные разделы:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/buy-excavators" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              Купить экскаватор
            </Link>
            <Link href="/komatsu-pc200" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              Komatsu PC200
            </Link>
            <Link href="/komatsu" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              Каталог Komatsu
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
