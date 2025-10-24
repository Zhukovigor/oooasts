"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { parseSpecificationsFromText, convertParsedToJSON, type ParsedSpecifications } from "@/lib/parse-specifications"

interface Category {
  id: string
  name: string
  slug: string
}

export default function EquipmentFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [rawText, setRawText] = useState("")
  const [parsedSpecs, setParsedSpecs] = useState<ParsedSpecifications | null>(null)
  const [showParser, setShowParser] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    model_code: "",
    description: "",
    category_id: "",
    main_image: "",
    price: "",
    price_on_request: false,
    is_active: true,
    is_featured: false,
    specifications: {} as Record<string, any>,
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const supabase = createBrowserClient()
    const { data } = await supabase.from("catalog_categories").select("id, name, slug").eq("is_active", true)
    setCategories(data || [])
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^а-яa-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  function handleParseText() {
    if (!rawText.trim()) {
      alert("Пожалуйста, вставьте текст с характеристиками")
      return
    }

    const parsed = parseSpecificationsFromText(rawText)
    setParsedSpecs(parsed)

    // Автоматически заполняем поля формы
    const specsJSON = convertParsedToJSON(parsed)
    setFormData((prev) => ({
      ...prev,
      specifications: specsJSON,
    }))

    alert("Характеристики успешно извлечены! Проверьте результат ниже.")
  }

  function applyParsedSpecs() {
    if (!parsedSpecs) return

    const specsJSON = convertParsedToJSON(parsedSpecs)
    setFormData((prev) => ({
      ...prev,
      specifications: specsJSON,
    }))

    setShowParser(false)
    alert("Характеристики применены к форме!")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      const equipmentData = {
        ...formData,
        price: formData.price ? Number.parseFloat(formData.price) : null,
        slug: formData.slug || generateSlug(formData.name),
      }

      const { error } = await supabase.from("catalog_models").insert([equipmentData])

      if (error) throw error

      alert("Техника успешно добавлена!")
      router.push("/admin/equipment")
    } catch (error) {
      console.error("Error creating equipment:", error)
      alert("Ошибка при добавлении техники")
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Добавить технику</h1>
          <p className="text-gray-600 mt-1">Заполните форму для добавления новой спецтехники</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Основная информация</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })
                  }}
                  placeholder="Например: Экскаватор KOMATSU PC300-8M0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="komatsu-pc300-8m0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Код модели</label>
                <Input
                  value={formData.model_code}
                  onChange={(e) => setFormData({ ...formData, model_code: e.target.value })}
                  placeholder="PC300-8M0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Категория *</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
                placeholder="Подробное описание техники..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL главного изображения</label>
              <Input
                value={formData.main_image}
                onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цена (₽)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="5000000"
                  disabled={formData.price_on_request}
                />
              </div>

              <div className="flex items-center gap-4 pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.price_on_request}
                    onChange={(e) => setFormData({ ...formData, price_on_request: e.target.checked, price: "" })}
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
                  <span className="text-sm text-gray-700">Избранное</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Активна</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Парсер характеристик
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Вставьте полный текст описания товара, и система автоматически извлечет все характеристики
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setShowParser(!showParser)}>
                {showParser ? "Скрыть" : "Показать"}
              </Button>
            </div>

            {showParser && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Вставьте текст с характеристиками
                  </label>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg min-h-[200px] font-mono text-sm"
                    placeholder="Например:
Гидравлический экскаватор KOMATSU PC300-8M0
Рабочий вес: 31100 кг
Объем ковша: 1.14 м³
Макс. глубина копания: 6400 м
Мощность двигателя: 194 кВт
Производитель двигателя: Komatsu
..."
                  />
                </div>

                <Button type="button" onClick={handleParseText} className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Извлечь характеристики
                </Button>

                {parsedSpecs && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-3">Извлеченные характеристики:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(parsedSpecs).map(([category, specs]) => {
                        if (Object.keys(specs).length === 0) return null
                        return (
                          <div key={category} className="bg-white p-3 rounded border">
                            <h4 className="font-medium text-gray-900 mb-2 capitalize">{category}</h4>
                            <div className="space-y-1 text-sm">
                              {Object.entries(specs).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-600">{key}:</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <Button type="button" onClick={applyParsedSpecs} className="mt-4 bg-green-600 hover:bg-green-700">
                      Применить к форме
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {Object.keys(formData.specifications).length > 0 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Предпросмотр характеристик</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.specifications).map(([category, specs]) => (
                  <div key={category} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2 capitalize">{category}</h3>
                    <div className="space-y-1 text-sm">
                      {Object.entries(specs as Record<string, any>).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "Сохранение..." : "Добавить технику"}
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
