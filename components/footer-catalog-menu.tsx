"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createBrowserClientSafe } from "@/lib/supabase/client"

interface Category {
  id: string
  name: string
  slug: string
}

export function FooterCatalogMenu() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const supabase = createBrowserClientSafe()
    if (!supabase) return

    async function fetchCategories() {
      const { data } = await supabase
        .from("catalog_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

      if (data) {
        setCategories(data)
      }
    }

    fetchCategories()
  }, [])

  if (categories.length === 0) {
    return null
  }

  return (
    <div>
      <h4 className="text-xl font-bold text-gray-900 mb-6 tracking-wide">КАТАЛОГ</h4>
      <ul className="space-y-3">
        <li>
          <Link
            href="/katalog"
            className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
          >
            Все категории
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/katalog/${category.slug}`}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-300 font-medium"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
