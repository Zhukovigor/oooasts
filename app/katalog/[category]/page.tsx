import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Footer from "@/components/footer";
import CatalogFilters from "@/components/catalog-filters";

// ==================== Типы данных ====================

interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

interface CatalogModel {
  id: number;
  name: string;
  slug: string;
  description?: string;
  main_image?: string;
  price?: number;
  currency?: string;
  price_on_request?: boolean;
  is_active: boolean;
  category_id: number;
  working_weight?: number;
  bucket_volume?: number;
  max_reach?: number;
  engine_manufacturer?: string;
  engine_power?: number;
  created_at: string;
}

type Props = {
  params: { category: string };
  searchParams: {
    brand?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  };
};

// ==================== Сервисы и утилиты ====================

// Сервис для работы с категориями
class CategoryService {
  static async getCategory(supabase: any, slug: string): Promise<CatalogCategory | null> {
    const { data: category } = await supabase
      .from("catalog_categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    return category || null;
  }
}

// Сервис для работы с моделями
class ModelService {
  static async getModels(
    supabase: any,
    categoryId: number,
    searchParams: Props["searchParams"]
  ): Promise<CatalogModel[]> {
    let query = supabase
      .from("catalog_models")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true);

    // Применяем фильтры
    if (searchParams.brand) {
      query = query.eq("engine_manufacturer", searchParams.brand);
    }

    if (searchParams.minPrice) {
      query = query.gte("price", Number(searchParams.minPrice));
    }

    if (searchParams.maxPrice) {
      query = query.lte("price", Number(searchParams.maxPrice));
    }

    // Применяем сортировку
    switch (searchParams.sort) {
      case "price_desc":
        query = query.order("price", { ascending: false, nullsFirst: false });
        break;
      case "name_asc":
        query = query.order("name", { ascending: true });
        break;
      case "name_desc":
        query = query.order("name", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      default:
        query = query.order("price", { ascending: true, nullsFirst: false });
    }

    const { data: models } = await query;

    return models || [];
  }
}

// Сервис для работы с метаданными
class MetadataService {
  static generateMetadata(
    category: CatalogCategory,
    searchParams: Props["searchParams"],
    params: { category: string }
  ): Metadata {
    const categoryUrl = `https://oooasts.ru/katalog/${params.category}`;
    const ogImage = category.image_url || "https://oooasts.ru/og-image.jpg";

    const canonicalParams = new URLSearchParams();
    if (searchParams.brand) canonicalParams.set("brand", searchParams.brand);
    if (searchParams.condition) canonicalParams.set("condition", searchParams.condition);
    if (searchParams.minPrice) canonicalParams.set("minPrice", searchParams.minPrice);
    if (searchParams.maxPrice) canonicalParams.set("maxPrice", searchParams.maxPrice);
    if (searchParams.sort) canonicalParams.set("sort", searchParams.sort);

    const canonicalUrl = `${categoryUrl}${canonicalParams.toString() ? `?${canonicalParams.toString()}` : ""}`;

    const robotsMeta = searchParams.page && Number(searchParams.page) > 1 ? "noindex, follow" : "index, follow";

    return {
      title: `${category.name} | Каталог | ООО АСТС`,
      description: category.description || `Каталог ${category.name.toLowerCase()}`,
      robots: robotsMeta,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${category.name} | Каталог | ООО АСТС`,
        description: category.description || `Каталог ${category.name.toLowerCase()}`,
        url: canonicalUrl,
        siteName: "ООО АСТС",
        locale: "ru_RU",
        type: "website",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: category.name,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${category.name} | Каталог | ООО АСТС`,
        description: category.description || `Каталог ${category.name.toLowerCase()}`,
        images: [ogImage],
      },
    };
  }
}

// ==================== Компоненты ====================

// Компонент навигационной цепочки
function Breadcrumbs({ category }: { category: CatalogCategory }) {
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
          <span className="text-gray-900">{category.name}</span>
        </div>
      </div>
    </div>
  );
}

// Компонент заголовка категории
function CategoryHeader({ category, modelCount }: { category: CatalogCategory; modelCount: number }) {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {category.name} <span className="text-gray-500">({modelCount})</span>
            </h1>
            {category.description && (
              <p className="text-lg text-gray-600 leading-relaxed">{category.description}</p>
            )}
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
  );
}

// Компонент фильтров
function Filters({ categorySlug }: { categorySlug: string }) {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-6 py-4">
        <CatalogFilters categorySlug={categorySlug} />
      </div>
    </div>
  );
}

// Компонент счетчика результатов
function ResultsCount({ count }: { count: number }) {
  return (
    <div className="mb-6">
      <p className="text-gray-600">
        Найдено <span className="font-semibold text-gray-900">{count}</span> моделей
      </p>
    </div>
  );
}

// Компонент карточки модели
function ModelCard({ model, categorySlug }: { model: CatalogModel; categorySlug: string }) {
  return (
    <Link
      key={model.id}
      href={`/katalog/${categorySlug}/${model.slug}`}
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

        {/* Характеристики */}
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

        {/* Цена */}
        <div className="border-t pt-4">
          <div className="text-lg font-bold text-gray-900 mb-3">Цена по запросу</div>
          <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg transition-colors">
            Заказать
          </button>
        </div>
      </div>
    </Link>
  );
}

// Компонент сетки моделей
function ModelsGrid({ models, categorySlug }: { models: CatalogModel[]; categorySlug: string }) {
  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Модели не найдены</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {models.map((model) => (
        <ModelCard key={model.id} model={model} categorySlug={categorySlug} />
      ))}
    </div>
  );
}

// ==================== Метаданные ====================

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const supabase = await createClient();

  const decodedCategory = decodeURIComponent(params.category);

  const category = await CategoryService.getCategory(supabase, decodedCategory);

  if (!category) {
    return {
      title: "Категория не найдена",
    };
  }

  return MetadataService.generateMetadata(category, searchParams, params);
}

// ==================== Основной компонент страницы ====================

export default async function CategoryPage({ params, searchParams }: Props) {
  const supabase = await createClient();

  const decodedCategory = decodeURIComponent(params.category);

  const category = await CategoryService.getCategory(supabase, decodedCategory);

  if (!category) {
    notFound();
  }

  const models = await ModelService.getModels(supabase, category.id, searchParams);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигационная цепочка */}
      <Breadcrumbs category={category} />

      {/* Заголовок категории */}
      <CategoryHeader category={category} modelCount={models.length} />

      {/* Фильтры */}
      <Filters categorySlug={params.category} />

      {/* Сетка моделей */}
      <div className="container mx-auto px-6 py-8">
        {/* Счетчик результатов */}
        <ResultsCount count={models.length} />

        {/* Сетка моделей */}
        <ModelsGrid models={models} categorySlug={params.category} />
      </div>

      {/* Футер */}
      <Footer />
    </div>
  );
}
