import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Footer from "@/components/footer";
import SiteNavigation from "@/components/site-navigation";

// ==================== Типы данных ====================

interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  specs_summary?: string;
  is_active: boolean;
  sort_order: number;
}

// ==================== Сервисы ====================

// Сервис для работы с категориями
class CategoryService {
  static async getCategories(supabase: any): Promise<CatalogCategory[]> {
    const { data: categories, error } = await supabase
      .from("catalog_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return categories || [];
  }
}

// ==================== Компоненты ====================

// Компонент навигационной цепочки
function Breadcrumbs() {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">
            Главная
          </Link>
          <span>/</span>
          <span className="text-gray-900">Каталог</span>
        </div>
      </div>
    </div>
  );
}

// Компонент заголовка
function PageHeader({ categoryCount }: { categoryCount: number }) {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Каталог <span className="text-gray-500">({categoryCount})</span>
          </h1>
        </div>
        <div className="relative">
          <input
            type="search"
            placeholder="Поиск"
            className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

// Компонент карточки категории
function CategoryCard({ category }: { category: CatalogCategory }) {
  return (
    <Link
      key={category.id}
      href={`/katalog/${category.slug}`}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      <div className="relative h-64 bg-gray-100">
        {category.image_url && (
          <Image
            src={category.image_url || "/placeholder.svg"}
            alt={category.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {category.name}
        </h2>
        {category.specs_summary && (
          <p className="text-sm text-gray-600 mb-3">{category.specs_summary}</p>
        )}
        {category.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{category.description}</p>
        )}
      </div>
    </Link>
  );
}

// Компонент сетки категорий
function CategoriesGrid({ categories }: { categories: CatalogCategory[] }) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Категории не найдены</p>
        <p className="text-gray-500 mt-2">В настоящий момент каталог пуст</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}

// ==================== Метаданные ====================

export const metadata: Metadata = {
  title: "Каталог спецтехники | ООО АСТС",
  description: "Каталог строительной спецтехники: автобетононасосы, экскаваторы, бульдозеры и другая техника из Китая",
};

// ==================== Основной компонент страницы ====================

export default async function KatalogPage() {
  const supabase = await createClient();

  const categories = await CategoryService.getCategories(supabase);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNavigation />

      {/* Навигационная цепочка */}
      <Breadcrumbs />

      {/* Заголовок */}
      <PageHeader categoryCount={categories.length} />

      {/* Сетка категорий */}
      <div className="container mx-auto px-6">
        <CategoriesGrid categories={categories} />
      </div>

      {/* Футер */}
      <Footer />
    </div>
  );
}
