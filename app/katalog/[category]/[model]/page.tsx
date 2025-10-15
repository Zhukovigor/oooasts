import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { OrderModal } from "@/components/order-modal"
import Footer from "@/components/footer"

type Props = {
  params: { category: string; model: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
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

// Функция для перевода ключей характеристик
function translateSpecKey(key: string): string {
  const translations: Record<string, string> = {
    // Общие
    "chassis": "Шасси",
    "delivery": "Поставка",
    "warranty": "Гарантия",
    "fuel_tank": "Топливный бак",
    "water_tank": "Водяной бак",
    "engine_model": "Модель двигателя",
    "engine_power": "Мощность двигателя",
    "emission_standard": "Экологический стандарт",
    
    // Бетононасосы
    "pressure": "Давление",
    "depth_reach": "Глубина подачи",
    "hose_length": "Длина шланга",
    "pump_cycles": "Циклы насоса",
    "total_width": "Общая ширина",
    "total_height": "Общая высота",
    "total_length": "Общая длина",
    "pipe_diameter": "Диаметр трубы",
    "stroke_length": "Длина хода",
    "hydraulic_tank": "Гидравлический бак",
    "vertical_reach": "Вертикальная подача",
    "pump_output": "Производительность насоса",
    "horizontal_reach": "Горизонтальная подача",
    "boom_sections": "Секции стрелы",
    "pressure_low": "Давление (низкое)",
    "pressure_high": "Давление (высокое)",
    "pump_cycles_low": "Циклы насоса (низкие)",
    "pump_cycles_high": "Циклы насоса (высокие)",
    "pump_output_high": "Производительность (высокая)",
    "cylinder_diameter": "Диаметр цилиндра",

    // Экскаваторы
    "bucket_capacity": "Объем ковша",
    "operating_weight": "Рабочий вес",
    "max_digging_depth": "Макс. глубина копания",
    "max_digging_reach": "Макс. радиус копания",
    "engine_manufacturer": "Производитель двигателя",
    "rated_power": "Номинальная мощность",
    "stick_length": "Длина рукояти",
    "boom_length": "Длина стрелы",
    "max_dumping_height": "Макс. высота разгрузки",
    "max_digging_height": "Макс. высота копания",
    "max_working_radius": "Макс. радиус работ",
    "ground_pressure": "Удельное давление на грунт",

    // Двигатель
    "engine_origin": "Страна происхождения",
    "engine_assembly": "Страна сборки",
    "power": "Мощность",
    "rpm": "Обороты",
    "cylinders": "Количество цилиндров",
    "engine_displacement": "Рабочий объем двигателя",

    // Ходовая часть
    "max_forward_speed": "Макс. скорость движения вперед",
    "max_backward_speed": "Макс. скорость движения назад",
    "min_turning_radius": "Мин. радиус поворота",
    "track_base": "База гусеничного хода",

    // Емкости
    "engine_oil": "Масло двигателя",
    "cooling_system": "Система охлаждения",
    "hydraulic_system": "Гидравлическая система",

    // Габариты
    "transport_length": "Транспортная длина",
    "transport_width": "Транспортная ширина",
    "transport_height": "Транспортная высота",

    // Бренд
    "brand": "Бренд",
    "manufacturer_country": "Страна производитель",
    "assembly_country": "Страна сборки"
  }

  return translations[key] || key
}

// Функция для определения категории
function getCategory(key: string): string {
  const categoryMapping: Record<string, string> = {
    // Шасси и ходовая часть
    "chassis": "Шасси",
    "total_width": "Шасси",
    "total_height": "Шасси", 
    "total_length": "Шасси",
    "max_forward_speed": "Ходовая часть",
    "max_backward_speed": "Ходовая часть",
    "min_turning_radius": "Ходовая часть",
    "track_base": "Ходовая часть",
    
    // Емкости
    "fuel_tank": "Емкости",
    "water_tank": "Емкости",
    "hydraulic_tank": "Емкости",
    "engine_oil": "Емкости",
    "cooling_system": "Емкости",
    "hydraulic_system": "Емкости",
    
    // Двигатель
    "engine_model": "Двигатель",
    "engine_power": "Двигатель",
    "emission_standard": "Двигатель",
    "engine_manufacturer": "Двигатель",
    "rated_power": "Двигатель",
    "engine_origin": "Двигатель",
    "engine_assembly": "Двигатель",
    "power": "Двигатель",
    "rpm": "Двигатель",
    "cylinders": "Двигатель",
    "engine_displacement": "Двигатель",
    
    // Рабочие характеристики
    "pressure": "Рабочие характеристики",
    "depth_reach": "Рабочие характеристики",
    "hose_length": "Рабочие характеристики",
    "pump_cycles": "Рабочие характеристики",
    "pipe_diameter": "Рабочие характеристики",
    "stroke_length": "Рабочие характеристики",
    "vertical_reach": "Рабочие характеристики",
    "pump_output": "Рабочие характеристики",
    "horizontal_reach": "Рабочие характеристики",
    "boom_sections": "Рабочие характеристики",
    "operating_weight": "Рабочие характеристики",
    "bucket_capacity": "Рабочие характеристики",
    "max_digging_depth": "Рабочие характеристики",
    "max_digging_reach": "Рабочие характеристики",
    "stick_length": "Рабочие характеристики",
    "boom_length": "Рабочие характеристики",
    "max_dumping_height": "Рабочие характеристики",
    "max_digging_height": "Рабочие характеристики",
    "max_working_radius": "Рабочие характеристики",
    "ground_pressure": "Рабочие характеристики",
    
    // Габариты
    "transport_length": "Габариты",
    "transport_width": "Габариты",
    "transport_height": "Габариты",
    
    // Условия поставки
    "delivery": "Условия поставки",
    
    // Гарантия
    "warranty": "Гарантия",
    
    // Дополнительная информация
    "brand": "Дополнительная информация",
    "manufacturer_country": "Дополнительная информация",
    "assembly_country": "Дополнительная информация"
  }

  return categoryMapping[key] || "Дополнительная информация"
}

// Функция для группировки характеристик по категориям
function groupSpecificationsByCategory(specs: Record<string, any>) {
  const categories: Record<string, Record<string, any>> = {}

  Object.entries(specs).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      const translatedKey = translateSpecKey(key)
      const category = getCategory(key)
      
      if (!categories[category]) {
        categories[category] = {}
      }
      
      categories[category][translatedKey] = value
    }
  })

  return categories
}

// Порядок отображения категорий
const categoryOrder = [
  "Рабочие характеристики",
  "Двигатель", 
  "Ходовая часть",
  "Шасси",
  "Емкости",
  "Габариты",
  "Условия поставки",
  "Гарантия",
  "Дополнительная информация"
]

export default async function ModelPage({ params }: Props) {
  const supabase = await createClient()

  const { data: category } = await supabase
    .from("catalog_categories")
    .select("*")
    .eq("slug", params.category)
    .single()

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

  // Группируем и переводим спецификации
  const groupedSpecifications = model.specifications 
    ? groupSpecificationsByCategory(model.specifications)
    : null

  // Сортируем категории согласно порядку
  const sortedCategories = groupedSpecifications 
    ? Object.entries(groupedSpecifications).sort(([a], [b]) => {
        const indexA = categoryOrder.indexOf(a)
        const indexB = categoryOrder.indexOf(b)
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
      })
    : []

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
        {sortedCategories.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Характеристики</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {sortedCategories.map(([category, specs]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{category}</h3>
                  <div className="space-y-2">
                    {Object.entries(specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-gray-600 text-sm">{key}</span>
                        <span className="font-medium text-gray-900 text-sm text-right">
                          {typeof value === 'number' ? value.toString() : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
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
