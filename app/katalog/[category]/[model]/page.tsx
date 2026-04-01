import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from 'next/navigation';
import type { Metadata } from "next";
import { OrderModal } from "@/components/order-modal";
import Footer from "@/components/footer";
import { ImageGallery } from "@/components/image-gallery";

// ==================== Типы данных ====================

interface EngineSpecs {
  model?: string;
  power?: number;
  emission_standard?: string;
  manufacturer?: string;
  origin?: string;
  assembly?: string;
  rated_power?: number;
  rpm?: number;
  cylinders?: number;
  displacement?: number;
}

interface DimensionSpecs {
  transport_length?: number;
  transport_width?: number;
  transport_height?: number;
  total_width?: number;
  total_height?: number;
  total_length?: number;
  track_length?: number;
  track_frame_width?: number;
  track_width?: number;
}

interface PerformanceSpecs {
  pressure?: number;
  depth_reach?: number;
  hose_length?: number;
  pump_cycles?: number;
  pump_output?: number;
  vertical_reach?: number;
  pump_output_low?: number;
  pump_output_high?: number;
  horizontal_reach?: number;
  boom_sections?: number;
  pressure_low?: number;
  pressure_high?: number;
  pump_cycles_low?: number;
  pump_cycles_high?: number;
  cylinder_diameter?: number;
  operating_weight?: number;
  bucket_capacity?: number;
  max_digging_depth?: number;
  max_digging_reach?: number;
  stick_length?: number;
  boom_length?: number;
  max_dumping_height?: number;
  max_digging_height?: number;
  max_working_radius?: number;
  ground_pressure?: number;
  bucket_digging_force?: number;
  arm_digging_force?: number;
}

interface CapacitySpecs {
  fuel_tank?: number;
  water_tank?: number;
  hydraulic_tank?: number;
  engine_oil?: number;
  cooling_system?: number;
  hydraulic_system?: number;
}

interface ChassisSpecs {
  max_forward_speed?: number;
  max_backward_speed?: number;
  min_turning_radius?: number;
  track_base?: number;
  chassis?: string;
  forward_speed?: number;
  backward_speed?: number;
}

interface DeliverySpecs {
  delivery?: string;
}

interface WarrantySpecs {
  warranty?: string;
}

interface AdditionalSpecs {
  brand?: string;
  manufacturer_country?: string;
  assembly_country?: string;
  work_modes?: string;
  fuel_saving?: string;
  hydraulic_system_type?: string;
}

interface ModelSpecs {
  engine?: EngineSpecs;
  dimensions?: DimensionSpecs;
  performance?: PerformanceSpecs;
  capacity?: CapacitySpecs;
  chassis?: ChassisSpecs;
  delivery?: DeliverySpecs;
  warranty?: WarrantySpecs;
  additional?: AdditionalSpecs;
  // Плоский формат (для бетононасосов и новых данных)
  [key: string]: any;
}

interface CatalogModel {
  id: number;
  name: string;
  slug: string;
  description?: string;
  main_image?: string;
  images?: string[];
  specifications?: ModelSpecs;
  price?: number;
  currency?: string;
  price_on_request?: boolean;
  is_active: boolean;
  views_count?: number;
  category_id: number;
  // Основные характеристики (для экскаваторов)
  working_weight?: number;
  bucket_volume?: number;
  max_digging_depth?: number;
  max_reach?: number;
  engine_power?: number;
  engine_manufacturer?: string;
}

interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
}

type Props = {
  params: { category: string; model: string };
};

// ==================== Сервисы и утилиты ====================

// Сервис для работы с переводами
class TranslationService {
  private static translations: Record<string, string> = {
    // Общие
    chassis: "Шасси",
    delivery: "Поставка",
    warranty: "Гарантия",
    fuel_tank: "Топливный бак",
    water_tank: "Водяной бак",
    engine_model: "Модель двигателя",
    engine_power: "Мощность двигателя",
    emission_standard: "Экологический стандарт",

    // Бетононасосы
    pressure: "Давление",
    depth_reach: "Глубина подачи",
    hose_length: "Длина шланга",
    pump_cycles: "Циклы насоса",
    total_width: "Общая ширина",
    total_height: "Общая высота",
    total_length: "Общая длина",
    pipe_diameter: "Диаметр трубы",
    stroke_length: "Длина хода",
    hydraulic_tank: "Гидравлический бак",
    vertical_reach: "Вертикальная подача",
    pump_output: "Производительность насоса",
    horizontal_reach: "Горизонтальная подача",
    boom_sections: "Секции стрелы",
    pressure_low: "Давление (низкое)",
    pressure_high: "Давление (высокое)",
    pump_cycles_low: "Циклы насоса (низкие)",
    pump_cycles_high: "Циклы насоса (высокие)",
    pump_output_low: "Производительность насоса",
    pump_output_high: "Производительность (высокая)",
    cylinder_diameter: "Диаметр цилиндра",

    // Экскаваторы (русские ключи)
    "Топливный бак": "Топливный бак",
    "Масло двигателя": "Масло двигателя",
    "Гидравлический бак": "Гидравлический бак",
    "Система охлаждения": "Система охлаждения",
    "Гидравлическая система": "Гидравлическая система",
    "Транспортная длина": "Транспортная длина",
    "Транспортная высота": "Транспортная высота",
    "Транспортная ширина": "Транспортная ширина",
    "Длина гусеничной ленты": "Длина гусеничной ленты",
    "Ширина гусеничного хода": "Ширина гусеничного хода",
    Обороты: "Обороты",
    Мощность: "Мощность",
    "Страна сборки": "Страна сборки",
    "Модель двигателя": "Модель двигателя",
    "Количество цилиндров": "Количество цилиндров",
    "Страна происхождения": "Страна происхождения",
    "Экологический стандарт": "Экологический стандарт",
    "Рабочий объем двигателя": "Рабочий объем двигателя",
    "Производитель двигателя": "Производитель двигателя",
    "Ширина гусеницы": "Ширина гусеницы",
    "Мин. радиус поворота": "Мин. радиус поворота",
    "База гусеничного хода": "База гусеничного хода",
    "Скорость движения назад": "Скорость движения назад",
    "Скорость движения вперед": "Скорость движения вперед",
    "Объем ковша": "Объем ковша",
    "Рабочий вес": "Рабочий вес",
    "Длина стрелы": "Длина стрелы",
    "Длина рукояти": "Длина рукояти",
    "Макс. радиус работ": "Макс. радиус работ",
    "Макс. высота копания": "Макс. высота копания",
    "Усилие копания ковша": "Усилие копания ковша",
    "Макс. глубина копания": "Макс. глубина копания",
    "Макс. высота разгрузки": "Макс. высота разгрузки",
    "Усилие копания рукояти": "Усилие копания рукояти",
    "Удельное давление на грунт": "Удельное давление на грунт",
    Бренд: "Бренд",
    "Режимы работы": "Режимы работы",
    "Экономия топлива": "Экономия топлива",
    "Страна производитель": "Страна производитель",
    "Гидравлическая система": "Гидравлическая система",
  };

  static translate(key: string): string {
    return this.translations[key] || key;
  }
}

// Сервис для определения категорий характеристик
class CategoryService {
  private static categoryMapping: Record<string, string> = {
    // Рабочие характеристики (экскаваторы)
    operating_weight: "Рабочие характеристики",
    bucket_capacity: "Рабочие характеристики",
    max_digging_depth: "Рабочие характеристики",
    max_digging_reach: "Рабочие характеристики",
    stick_length: "Рабочие характеристики",
    boom_length: "Рабочие характеристики",
    max_dumping_height: "Рабочие характеристики",
    max_digging_height: "Рабочие характеристики",
    max_working_radius: "Рабочие характеристики",
    ground_pressure: "Рабочие характеристики",
    bucket_digging_force: "Рабочие характеристики",
    arm_digging_force: "Рабочие характеристики",

    // Рабочие характеристики (бетононасосы)
    pressure: "Рабочие характеристики",
    depth_reach: "Рабочие характеристики",
    hose_length: "Рабочие характеристики",
    pump_cycles: "Рабочие характеристики",
    pipe_diameter: "Рабочие характеристики",
    stroke_length: "Рабочие характеристики",
    vertical_reach: "Рабочие характеристики",
    pump_output: "Рабочие характеристики",
    pump_output_low: "Рабочие характеристики",
    pump_output_high: "Рабочие характеристики",
    horizontal_reach: "Рабочие характеристики",
    boom_sections: "Рабочие характеристики",
    pressure_low: "Рабочие характеристики",
    pressure_high: "Рабочие характеристики",
    pump_cycles_low: "Рабочие характеристики",
    pump_cycles_high: "Рабочие характеристики",
    cylinder_diameter: "Рабочие характеристики",

    // Двигатель
    engine_model: "Двигатель",
    engine_power: "Двигатель",
    emission_standard: "Двигатель",
    engine_manufacturer: "Двигатель",
    rated_power: "Двигатель",
    engine_origin: "Двигатель",
    engine_assembly: "Двигатель",
    power: "Двигатель",
    rpm: "Двигатель",
    cylinders: "Двигатель",
    engine_displacement: "Двигатель",

    // Ходовая часть
    max_forward_speed: "Ходовая часть",
    max_backward_speed: "Ходовая часть",
    min_turning_radius: "Ходовая часть",
    track_base: "Ходовая часть",
    chassis: "Ходовая часть",
    track_width: "Ходовая часть",
    forward_speed: "Ходовая часть",
    backward_speed: "Ходовая часть",

    // Емкости
    fuel_tank: "Емкости",
    water_tank: "Емкости",
    hydraulic_tank: "Емкости",
    engine_oil: "Емкости",
    cooling_system: "Емкости",
    hydraulic_system: "Емкости",

    // Габариты
    transport_length: "Габариты",
    transport_width: "Габариты",
    transport_height: "Габариты",
    total_width: "Габариты",
    total_height: "Габариты",
    total_length: "Габариты",
    track_length: "Габариты",
    track_frame_width: "Габариты",

    // Условия поставки
    delivery: "Условия поставки",

    // Гарантия
    warranty: "Гарантия",

    // Дополнительная информация
    brand: "Дополнительная информация",
    manufacturer_country: "Дополнительная информация",
    assembly_country: "Дополнительная информация",
    work_modes: "Дополнительная информация",
    fuel_saving: "Дополнительная информация",
    hydraulic_system_type: "Дополнительная информация",
  };

  static getCategory(key: string): string {
    return this.categoryMapping[key] || "Дополнительная информация";
  }
}

// Сервис для обработки спецификаций
class SpecificationProcessor {
  static processSpecifications(specs: ModelSpecs): Record<string, Record<string, any>> {
    const categories: Record<string, Record<string, any>> = {};

    // Определяем формат данных
    const isNestedFormat = this.isNestedFormat(specs);

    let flatSpecs: Record<string, any> = {};

    if (isNestedFormat) {
      // Экскаваторы - извлекаем из вложенной структуры
      flatSpecs = this.extractNestedSpecifications(specs);
    } else {
      // Бетононасосы - уже плоский формат или новый парсер
      flatSpecs = this.flattenSpecifications(specs);
    }

    // Группируем характеристики по категориям
    Object.entries(flatSpecs).forEach(([key, value]) => {
      // Фильтруем пустые, null и undefined значения
      if (this.isInvalidValue(value)) {
        return;
      }

      // Пропускаем очень длинные значения (признак ошибки парсинга)
      if (typeof value === 'string' && value.length > 200) {
        return;
      }

      // Определяем категорию и чистый ключ
      let category = "Дополнительная информация";
      let cleanKey = key;

      // Для экскаваторов: извлекаем категорию из префикса
      if (isNestedFormat && key.includes("_")) {
        const parts = key.split("_");
        const categoryPrefix = parts[0];
        category = categoryPrefix;
        cleanKey = parts.slice(1).join("_");
      } else {
        // Для бетононасосов и нового парсера: используем функцию getCategory
        category = CategoryService.getCategory(key);
      }

      const translatedKey = TranslationService.translate(cleanKey);

      // Исключаем дублирующиеся или малоинформативные ключи
      if (this.isExcludedKey(translatedKey)) {
        return;
      }

      if (!categories[category]) {
        categories[category] = {};
      }

      // Не добавляем дубликаты, предпочитаем существующее значение если оно более информативно
      if (!categories[category][translatedKey]) {
        categories[category][translatedKey] = value;
      } else {
        // Если новое значение содержит больше информации, заменяем
        const existing = String(categories[category][translatedKey]);
        const newVal = String(value);
        if (newVal.length > existing.length && newVal.length < 100) {
          categories[category][translatedKey] = value;
        }
      }
    });

    return categories;
  }

  private static isNestedFormat(specs: ModelSpecs): boolean {
    return Object.values(specs).some(
      (value) => value && typeof value === "object" && !Array.isArray(value)
    );
  }

  private static extractNestedSpecifications(specs: ModelSpecs): Record<string, any> {
    const flattened: Record<string, any> = {};

    function extractFromObject(obj: any, categoryPrefix = "") {
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        Object.entries(obj).forEach(([key, value]) => {
          if (value && typeof value === "object" && !Array.isArray(value)) {
            // Рекурсивно извлекаем из вложенных объектов
            extractFromObject(value, categoryPrefix ? `${categoryPrefix}_${key}` : key);
          } else {
            // Сохраняем простые значения с префиксом категории
            const fullKey = categoryPrefix ? `${categoryPrefix}_${key}` : key;
            flattened[fullKey] = value;
          }
        });
      }
    }

    // Обрабатываем корневой объект спецификаций
    Object.entries(specs).forEach(([category, categoryData]) => {
      if (categoryData && typeof categoryData === "object") {
        Object.entries(categoryData).forEach(([key, value]) => {
          if (value && typeof value === "object" && !Array.isArray(value)) {
            // Если значение - объект, рекурсивно извлекаем
            extractFromObject(value, `${category}_${key}`);
          } else {
            // Простое значение
            flattened[`${category}_${key}`] = value;
          }
        });
      }
    });

    return flattened;
  }

  private static flattenSpecifications(specs: ModelSpecs): Record<string, any> {
    const flatSpecs: Record<string, any> = {};

    Object.entries(specs).forEach(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Если ценность - объект, разворачиваем его
        Object.entries(value).forEach(([subKey, subValue]) => {
          flatSpecs[`${key}_${subKey}`] = subValue;
        });
      } else {
        flatSpecs[key] = value;
      }
    });

    return flatSpecs;
  }

  private static isInvalidValue(value: any): boolean {
    return value === null || value === undefined || value === "" || value === "N/A";
  }

  private static isExcludedKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('примечание') || lowerKey.includes('другое');
  }
}

// ==================== Компоненты ====================

// Компонент навигационной цепочки
function Breadcrumbs({ category, model }: { category: CatalogCategory; model: CatalogModel }) {
  const decodedCategorySlug = decodeURIComponent(category.slug);
  const decodedModelSlug = decodeURIComponent(model.slug);

  return (
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
          <Link href={`/katalog/${decodedCategorySlug}`} className="hover:text-blue-600">
            {category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{model.name}</span>
        </div>
      </div>
    </div>
  );
}

// Компонент основной информации о модели
function ModelHero({ model }: { model: CatalogModel }) {
  return (
    <div className="grid md:grid-cols-2 gap-12 mb-12">
      {/* Изображения */}
      <div>
        <ImageGallery images={model.images || []} mainImage={model.main_image} name={model.name} />
      </div>

      {/* Информация */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{model.name}</h1>

        {/* Ключевые характеристики */}
        <KeySpecs model={model} />

        {/* Цена и CTA */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-2xl font-bold text-gray-900 mb-4">
            {model.price_on_request
              ? "Цена по запросу"
              : `${model.price?.toLocaleString("ru-RU")} ${model.currency}`}
          </div>
          <OrderModal model={model} />
        </div>
      </div>
    </div>
  );
}

// Компонент ключевых характеристик
function KeySpecs({ model }: { model: CatalogModel }) {
  const keySpecs = getKeySpecs(model);

  if (keySpecs.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {keySpecs.map((spec, index) => (
        <div
          key={spec.label}
          className={`flex justify-between py-3 ${index < keySpecs.length - 1 ? "border-b" : ""}`}
        >
          <span className="text-gray-600">{spec.label}</span>
          <span className="font-bold text-gray-900">{spec.value}</span>
        </div>
      ))}
    </div>
  );
}

// Компонент полных спецификаций
function FullSpecifications({ specs }: { specs: Record<string, Record<string, any>> }) {
  const sortedCategories = sortCategories(specs);

  if (sortedCategories.length === 0) return null;

  return (
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
                    {typeof value === "number" ? value.toString() : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент описания
function ModelDescription({ description }: { description?: string }) {
  if (!description) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mt-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">О товаре</h2>
      <p className="text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
}

// ==================== Вспомогательные функции ====================

// Определяем основные характеристики для блока Key Specs
function getKeySpecs(model: CatalogModel) {
  const specs = model.specifications || {};
  const keySpecs = [];

  // Для экскаваторов
  if (model.working_weight) {
    keySpecs.push({ label: "Рабочий вес", value: `${model.working_weight} кг` });
  }
  if (model.bucket_volume) {
    keySpecs.push({ label: "Объем ковша", value: `${model.bucket_volume} м³` });
  }
  if (model.max_digging_depth) {
    keySpecs.push({ label: "Макс. глубина копания", value: `${model.max_digging_depth} м` });
  }
  if (model.max_reach) {
    keySpecs.push({ label: "Макс. радиус работ", value: `${model.max_reach} м` });
  }

  // Для бетононасосов
  if (specs.pump_output_low || specs.pump_output_high) {
    const output = specs.pump_output_low || specs.pump_output_high;
    keySpecs.push({ label: "Производительность", value: `${output} м³/ч` });
  }
  if (specs.pressure_low || specs.pressure_high) {
    const pressure = specs.pressure_low || specs.pressure_high;
    keySpecs.push({ label: "Давление", value: `${pressure} МПа` });
  }
  if (specs.vertical_reach) {
    keySpecs.push({ label: "Вертикальная подача", value: `${specs.vertical_reach} м` });
  }

  // Общие
  if (model.engine_power) {
    keySpecs.push({ label: "Мощность двигателя", value: `${model.engine_power} кВт` });
  }
  if (model.engine_manufacturer) {
    keySpecs.push({ label: "Производитель двигателя", value: model.engine_manufacturer });
  }

  return keySpecs;
}

// Сортируем категории согласно порядку
function sortCategories(specs: Record<string, Record<string, any>>) {
  const categoryOrder = [
    "Рабочие характеристики",
    "Двигатель",
    "Ходовая часть",
    "Емкости",
    "Габариты",
    "Условия поставки",
    "Гарантия",
    "Дополнительная информация",
  ];

  return Object.entries(specs).sort(([a], [b]) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
}

// ==================== Метаданные ====================

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();

  const decodedModelSlug = decodeURIComponent(params.model);
  const decodedCategorySlug = decodeURIComponent(params.category);

  const { data: model } = await supabase
    .from("catalog_models")
    .select("name, description, main_image")
    .eq("slug", decodedModelSlug)
    .single();

  if (!model) {
    return {
      title: "Модель не найдена",
    };
  }

  const modelUrl = `https://oooasts.ru/katalog/${decodedCategorySlug}/${decodedModelSlug}`;
  const ogImage = model.main_image || "https://oooasts.ru/og-image.jpg";

  return {
    title: `${model.name} | Каталог | ООО АСТС`,
    description: model.description || `Купить ${model.name}`,
    openGraph: {
      title: `${model.name} | Каталог | ООО АСТС`,
      description: model.description || `Купить ${model.name}`,
      url: modelUrl,
      siteName: "ООО АСТС",
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: model.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${model.name} | Каталог | ООО АСТС`,
      description: model.description || `Купить ${model.name}`,
      images: [ogImage],
    },
  };
}

// ==================== Основной компонент страницы ====================

export default async function ModelPage({ params }: Props) {
  const supabase = await createClient();

  const decodedCategorySlug = decodeURIComponent(params.category);
  const decodedModelSlug = decodeURIComponent(params.model);

  const { data: category } = await supabase
    .from("catalog_categories")
    .select("*")
    .eq("slug", decodedCategorySlug)
    .single();

  if (!category) {
    notFound();
  }

  const { data: model } = await supabase
    .from("catalog_models")
    .select("*")
    .eq("slug", decodedModelSlug)
    .eq("category_id", category.id)
    .eq("is_active", true)
    .single();

  if (!model) {
    notFound();
  }

  // Инкремент просмотров
  await supabase
    .from("catalog_models")
    .update({ views_count: (model.views_count || 0) + 1 })
    .eq("id", model.id);

  // Группируем и переводим спецификации
  const groupedSpecifications = model.specifications
    ? SpecificationProcessor.processSpecifications(model.specifications)
    : {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигационная цепочка */}
      <Breadcrumbs category={category} model={model} />

      {/* Детали модели */}
      <div className="container mx-auto px-6 py-12">
        <ModelHero model={model} />

        {/* Полные спецификации */}
        <FullSpecifications specs={groupedSpecifications} />

        {/* Описание */}
        <ModelDescription description={model.description} />
      </div>

      {/* Футер */}
      <Footer />
    </div>
  );
}
