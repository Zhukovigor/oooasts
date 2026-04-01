import HeroSlideFormClient from "./form-client"

export const metadata = {
  title: "Создать слайд | Админ панель",
  description: "Создание нового слайда баннера",
}

export default function NewHeroSlidePage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Создать слайд баннера</h1>
        <HeroSlideFormClient />
      </div>
    </div>
  )
}
