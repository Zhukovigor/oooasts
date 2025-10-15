import { createClient } from "@/lib/supabase/server" // Fixed import name
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { OrderModal } from "@/components/order-modal"
import Footer from "@/components/footer"
import { translateSpecKey } from "@/lib/catalog-translations"

type Props = {
  params: { category: string; model: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient() // Added await
  const { data: model } = await supabase
    .from("catalog_models")
    .select("name, description")
    .eq("slug", params.model)
    .single()

  if (!model) {
    return {
      title: "Модель не найдена",
    }
  }

  return {
    title: `${model.name} | Каталог | ООО АСТС`,
    description: model.description || `Купить ${model.name}`,
  }
}

export default async function ModelPage({ params }: Props) {
  const supabase = await createClient() // Added await

  const { data: category } = await supabase.from("catalog_categories").select("*").eq("slug", params.category).single()

  if (!category) {
    notFound()
  }

  const { data: model } = await supabase
    .from("catalog_models")
    .select("*")
    .eq("slug", params.model)
    .eq("category_id", category.id)
    .eq("is_active", true)
    .single()

  if (!model) {
    notFound()
  }

  // Increment views
  await supabase
    .from("catalog_models")
    .update({ views_count: (model.views_count || 0) + 1 })
    .eq("id", model.id)

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
            <Link href={`/katalog/${params.category}`} className="hover:text-blue-600">
              {category.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900">{model.name}</span>
          </div>
        </div>
      </div>

      {/* Model Details */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div>
            <div className="relative h-96 bg-white rounded-lg shadow-sm mb-4">
              {model.main_image && (
                <Image
                  src={model.main_image || "/placeholder.svg"}
                  alt={model.name}
                  fill
                  className="object-contain p-8"
                />
              )}
            </div>
            {model.images && model.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {model.images.map((img: string, idx: number) => (
                  <div key={idx} className="relative h-20 bg-white rounded border hover:border-blue-600 cursor-pointer">
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`${model.name} ${idx + 1}`}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{model.name}</h1>

            {/* Key Specs */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              {model.working_weight && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Рабочий вес</span>
                  <span className="font-bold text-gray-900">{model.working_weight} кг</span>
                </div>
              )}
              {model.bucket_volume && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Объем ковша</span>
                  <span className="font-bold text-gray-900">{model.bucket_volume} м³</span>
                </div>
              )}
              {model.max_digging_depth && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Макс. глубина копания</span>
                  <span className="font-bold text-gray-900">{model.max_digging_depth} м</span>
                </div>
              )}
              {model.engine_manufacturer && (
                <div className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">Производитель двигателя</span>
                  <span className="font-bold text-gray-900">{model.engine_manufacturer}</span>
                </div>
              )}
              {model.engine_power && (
                <div className="flex justify-between py-3">
                  <span className="text-gray-600">Мощность</span>
                  <span className="font-bold text-gray-900">{model.engine_power} кВт</span>
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-2xl font-bold text-gray-900 mb-4">Цена по запросу</div>
              <OrderModal model={model} />
            </div>
          </div>
        </div>

        {/* Full Specifications */}
        {model.specifications && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Характеристики</h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
              {Object.entries(model.specifications as Record<string, any>).map(([key, value]) => (
                <div key={key} className="flex justify-between py-3 border-b">
                  <span className="text-gray-600">{translateSpecKey(key)}</span>
                  <span className="font-medium text-gray-900">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {model.description && (
          <div className="bg-white rounded-lg shadow-sm p-8 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">О товаре</h2>
            <p className="text-gray-700 leading-relaxed">{model.description}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
