"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ImageIcon, Settings, FileText } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"

interface Category {
  id: string
  name: string
  slug: string
}

interface Equipment {
  id: string
  name: string
  slug: string
  model_code: string
  description: string
  category_id: string
  main_image: string
  price: number
  price_on_request: boolean
  is_active: boolean
  is_featured: boolean
  specifications: Record<string, any>
}

export default function EquipmentEditClient({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState<Equipment | null>(null)
  const [activeTab, setActiveTab] = useState<"basic" | "specs" | "gallery">("basic")

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const supabase = createBrowserClient()

    const [equipmentResult, categoriesResult] = await Promise.all([
      supabase.from("catalog_models").select("*").eq("id", id).single(),
      supabase.from("catalog_categories").select("id, name, slug").eq("is_active", true),
    ])

    if (equipmentResult.data) {
      setFormData(equipmentResult.data)
    }
    setCategories(categoriesResult.data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData) return

    setSaving(true)

    try {
      const supabase = createBrowserClient()

      const { error } = await supabase
        .from("catalog_models")
        .update({
          name: formData.name,
          slug: formData.slug,
          model_code: formData.model_code,
          description: formData.description,
          category_id: formData.category_id,
          main_image: formData.main_image,
          price: formData.price,
          price_on_request: formData.price_on_request,
          is_active: formData.is_active,
          is_featured: formData.is_featured,
          specifications: formData.specifications,
        })
        .eq("id", id)

      if (error) throw error

      alert("Техника успешно обновлена!")
      router.push("/admin/equipment")
    } catch (error) {
      console.error("Error updating equipment:", error)
      alert("Ошибка при обновлении техники")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Загрузка...</p>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Техника не найдена</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/equipment">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Редактировать технику</h1>
          <p className="text-gray-600 mt-1">{formData.name}</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab("basic")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "basic"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Основная информация
            </div>
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "specs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Характеристики
            </div>
          </button>
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "gallery"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Галерея
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "basic" && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Название *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Введите название техники"
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Код модели</label>
                  <Input
                    value={formData.model_code || ""}
                    onChange={(e) => setFormData({ ...formData, model_code: e.target.value })}
                    placeholder="Например: GKS-36"
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Slug (URL)</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="avtovyshka-gks-36"
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Категория *</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Описание</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Подробное описание техники..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Ценообразование и статус</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
                    <Input
                      type="number"
                      value={formData.price || ""}
                      onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                      disabled={formData.price_on_request}
                      placeholder="0"
                      className="h-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.price_on_request}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price_on_request: e.target.checked,
                          price: e.target.checked ? 0 : formData.price,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Цена по запросу</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Избранное (показывать в топе)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Активна (видна на сайте)</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "specs" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Характеристики добавляются при создании техники через парсер</p>
                <p className="text-sm text-gray-500">
                  Перейдите в редактирование через форму создания для полного редактирования характеристик
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "gallery" && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">URL главного изображения</label>
                  <Input
                    value={formData.main_image || ""}
                    onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="h-10"
                  />
                </div>

                {formData.main_image && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Предпросмотр изображения:</p>
                    <img
                      src={formData.main_image || "/placeholder.svg"}
                      alt={formData.name}
                      className="max-w-sm h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </Button>
          <Link href="/admin/equipment">
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
