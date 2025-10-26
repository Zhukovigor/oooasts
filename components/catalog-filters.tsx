"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { ChevronDown, LayoutGrid, List } from "lucide-react"

interface FilterOptions {
  brands: string[]
  minPrice: number
  maxPrice: number
}

interface CatalogFiltersProps {
  categorySlug: string
}

export default function CatalogFilters({ categorySlug }: CatalogFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient()

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    brands: [],
    minPrice: 0,
    maxPrice: 10000000,
  })

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Current filter values from URL
  const [filters, setFilters] = useState({
    brand: searchParams.get("brand") || "",
    condition: searchParams.get("condition") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "price_asc",
  })

  // Load filter options from database
  useEffect(() => {
    async function loadFilterOptions() {
      const { data: models } = await supabase
        .from("catalog_models")
        .select("engine_manufacturer, price")
        .eq("is_active", true)

      if (models) {
        const brands = [...new Set(models.map((m) => m.engine_manufacturer).filter(Boolean))] as string[]
        const prices = models.map((m) => m.price).filter(Boolean) as number[]
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 10000000

        setFilterOptions({
          brands: brands.sort(),
          minPrice,
          maxPrice,
        })
      }
    }

    loadFilterOptions()
  }, [supabase])

  const applyFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)

    const params = new URLSearchParams()
    if (newFilters.brand) params.set("brand", newFilters.brand)
    if (newFilters.condition) params.set("condition", newFilters.condition)
    if (newFilters.minPrice) params.set("minPrice", newFilters.minPrice)
    if (newFilters.maxPrice) params.set("maxPrice", newFilters.maxPrice)
    if (newFilters.sort && newFilters.sort !== "price_asc") params.set("sort", newFilters.sort)

    const queryString = params.toString()
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`)
    setOpenDropdown(null)
  }

  const resetFilters = () => {
    setFilters({
      brand: "",
      condition: "",
      minPrice: "",
      maxPrice: "",
      sort: "price_asc",
    })
    router.push(pathname)
    setOpenDropdown(null)
  }

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  const getSortLabel = () => {
    switch (filters.sort) {
      case "price_desc":
        return "По убыванию цены"
      case "name_asc":
        return "По названию А-Я"
      case "name_desc":
        return "По названию Я-А"
      case "newest":
        return "Сначала новые"
      default:
        return "По возрастанию цены"
    }
  }

  const getConditionLabel = () => {
    if (filters.condition === "new") return "Новая"
    if (filters.condition === "used") return "Б/У"
    return "Состояние"
  }

  const getBrandLabel = () => {
    return filters.brand || "Бренд"
  }

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left side - Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("sort")}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              >
                {getSortLabel()}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openDropdown === "sort" ? "rotate-180" : ""}`}
                />
              </button>

              {openDropdown === "sort" && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    {[
                      { value: "price_asc", label: "По возрастанию цены" },
                      { value: "price_desc", label: "По убыванию цены" },
                      { value: "name_asc", label: "По названию А-Я" },
                      { value: "name_desc", label: "По названию Я-А" },
                      { value: "newest", label: "Сначала новые" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => applyFilter("sort", option.value)}
                        className={`w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition-colors text-sm ${
                          filters.sort === option.value ? "bg-blue-50 text-blue-600 font-medium" : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("brand")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  filters.brand ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {getBrandLabel()}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openDropdown === "brand" ? "rotate-180" : ""}`}
                />
              </button>

              {openDropdown === "brand" && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="p-2">
                    <button
                      onClick={() => applyFilter("brand", "")}
                      className={`w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition-colors text-sm ${
                        !filters.brand ? "bg-blue-50 text-blue-600 font-medium" : ""
                      }`}
                    >
                      Все бренды
                    </button>
                    {filterOptions.brands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => applyFilter("brand", brand)}
                        className={`w-full text-left px-4 py-2 rounded hover:bg-gray-100 transition-colors text-sm ${
                          filters.brand === brand ? "bg-blue-50 text-blue-600 font-medium" : ""
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Condition Toggle Buttons */}
            <button
              onClick={() => applyFilter("condition", filters.condition === "new" ? "" : "new")}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                filters.condition === "new" ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Новая
            </button>

            <button
              onClick={() => applyFilter("condition", filters.condition === "used" ? "" : "used")}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                filters.condition === "used" ? "bg-blue-100 text-blue-700" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Б/У
            </button>

            {/* Reset Button */}
            {(filters.brand || filters.condition || filters.minPrice || filters.maxPrice) && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Сбросить
              </button>
            )}
          </div>

          {/* Right side - View toggles */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid" ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list" ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900"
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Close dropdowns when clicking outside */}
        {openDropdown && (
          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
