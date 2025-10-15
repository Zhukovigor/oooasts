import { createClient } from "@/lib/supabase/server" // Fixed import name
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Footer from "@/components/footer"

type Props = {
  params: { category: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient() // Added await
  const { data: category } = await supabase
    .from("catalog_categories")
    .select("name, description")
    .eq("slug", params.category)
    .single()

  if (!category) {
    return {
      title: "Категория не найдена",
    }
  }

  return {
    title: `${category.name} | Каталог | ООО АСТС`,
    description: category.description || `Каталог ${category.name.toLowerCase()}`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const supabase = await createClient() // Added await

  const { data: category } = await supabase
    .from("catalog_categories")
    .select("*")
    .eq("slug", params.category)
    .eq("is_active", true)
    .single()

  if (!category) {
    notFound()
  }

  const { data: models } = await supabase
    .from("catalog_models")
    .select("*")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">
              Главная
            </Link>
            <span>/</span>
            <Link href="/katalog" className="hover:text-blue-600">
              Каталог
            </Link>
            <span>/</span>
            <span className="text-gray-900">{category.name}</span>
          </div>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {category.name} <span className="text-gray-500">{models?.length || 0}</span>
              </h1>
              {category.description && <p className="text-lg text-gray-600 leading-relaxed">{category.description}</p>}
            </div>
            {category.image_url && (
              <div className="relative h-80">
                <Image
                  src={category.image_url || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 flex items-center gap-2">
                По возрастанию цены
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Со скидкой</button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">В наличии</button>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-blue-600 bg-blue-50 rounded">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 011-1h12a2 2 0 110 2H4a2 2 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models?.map((model) => (
            <Link
              key={model.id}
              href={`/katalog/${params.category}/${model.slug}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              <div className="relative h-64 bg-gray-100">
                {model.main_image && (
                  <Image
                    src={model.main_image || "/placeholder.svg"}
                    alt={model.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {model.name}
                </h3>

                {/* Specs */}
                <div className="space-y-2 mb-4">
                  {model.working_weight && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Рабочий вес</span>
                      <span className="font-medium text-gray-900">{model.working_weight} кг</span>
                    </div>
                  )}
                  {model.bucket_volume && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Объем ковша</span>
                      <span className="font-medium text-gray-900">{model.bucket_volume} м³</span>
                    </div>
                  )}
                  {model.max_reach && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Макс. глубина копания</span>
                      <span className="font-medium text-gray-900">{model.max_reach} м</span>
                    </div>
                  )}
                  {model.engine_manufacturer && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Производитель двигателя</span>
                      <span className="font-medium text-gray-900">{model.engine_manufacturer}</span>
                    </div>
                  )}
                  {model.engine_power && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Мощность</span>
                      <span className="font-medium text-gray-900">{model.engine_power} кВт</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="border-t pt-4">
                  <div className="text-lg font-bold text-gray-900 mb-3">Цена по запросу</div>
                  <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition-colors">
                    Заказать
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
