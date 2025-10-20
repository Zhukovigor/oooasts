"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Edit, Trash2, Eye, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"

interface Equipment {
  id: string
  name: string
  slug: string
  model_code: string
  description: string
  main_image: string
  price: number
  price_on_request: boolean
  is_active: boolean
  is_featured: boolean
  views_count: number
  created_at: string
  category_id: string
}

interface Category {
  id: string
  name: string
}

export default function EquipmentListClient() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const [equipmentResult, categoriesResult] = await Promise.all([
        supabase.from("catalog_models").select("*").order("created_at", { ascending: false }),
        supabase.from("catalog_categories").select("id, name"),
      ])

      if (equipmentResult.error) throw equipmentResult.error
      if (categoriesResult.error) throw categoriesResult.error

      setEquipment(equipmentResult.data || [])
      setCategories(categoriesResult.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteEquipment(id: string) {
    if (!confirm("Вы уверены, что хотите удалить эту технику?")) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const { error } = await supabase.from("catalog_models").delete().eq("id", id)

      if (error) throw error

      setEquipment(equipment.filter((item) => item.id !== id))
      alert("Техника успешно удалена")
    } catch (error) {
      console.error("Error deleting equipment:", error)
      alert("Ошибка при удалении техники")
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Без категории"
  }

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? item.is_active : !item.is_active)
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление спецтехникой</h1>
          <p className="text-gray-600 mt-1">Всего единиц техники: {equipment.length}</p>
        </div>
        <Link href="/admin/equipment/new">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Добавить технику
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Поиск по названию, модели или описанию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="all">Вся техника</option>
              <option value="active">Активная</option>
              <option value="inactive">Неактивная</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Загрузка...</p>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Техника не найдена</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEquipment.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {item.main_image && (
                      <div className="w-full lg:w-48 h-32 flex-shrink-0">
                        <img
                          src={item.main_image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=128&width=192"
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                          {item.model_code && <p className="text-sm text-gray-600">Модель: {item.model_code}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.is_featured && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              Избранное
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              item.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {item.is_active ? "Активна" : "Неактивна"}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>Категория: {getCategoryName(item.category_id)}</span>
                        {item.price_on_request ? (
                          <span className="font-medium text-blue-600">Цена по запросу</span>
                        ) : item.price ? (
                          <span className="font-medium text-green-600">{item.price.toLocaleString("ru-RU")} ₽</span>
                        ) : null}
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {item.views_count || 0}
                        </span>
                        <span>{new Date(item.created_at).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </div>
                    <div className="flex lg:flex-col gap-2">
                      <Link href={`/admin/equipment/edit/${item.id}`} className="flex-1 lg:flex-none">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать
                        </Button>
                      </Link>
                      <Link href={`/katalog/${item.slug}`} target="_blank" className="flex-1 lg:flex-none">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Eye className="w-4 h-4 mr-2" />
                          Просмотр
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEquipment(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 lg:flex-none"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
