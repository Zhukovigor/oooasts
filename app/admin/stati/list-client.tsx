"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Edit, Trash2, Eye, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  status: string
  author: string
  views: number
  featured: boolean
  published_at: string
  created_at: string
}

export default function ArticleListClient() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all")

  useEffect(() => {
    fetchArticles()
  }, [])

  async function fetchArticles() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setArticles(data || [])
    } catch (error) {
      console.error("Error fetching articles:", error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteArticle(id: string) {
    if (!confirm("Вы уверены, что хотите удалить эту статью?")) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    try {
      const { error } = await supabase.from("articles").delete().eq("id", id)

      if (error) throw error

      setArticles(articles.filter((article) => article.id !== id))
      alert("Статья успешно удалена")
    } catch (error) {
      console.error("Error deleting article:", error)
      alert("Ошибка при удалении статьи")
    }
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || article.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление статьями</h1>
          <p className="text-gray-600 mt-1">Всего статей: {articles.length}</p>
        </div>
        <Link href="/admin/stati/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Создать статью
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
                  placeholder="Поиск по названию или описанию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "published" | "draft")}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="all">Все статьи</option>
              <option value="published">Опубликованные</option>
              <option value="draft">Черновики</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Загрузка...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Статьи не найдены</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{article.title}</h3>
                        <div className="flex items-center gap-2">
                          {article.featured && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              Избранное
                            </span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              article.status === "published"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {article.status === "published" ? "Опубликовано" : "Черновик"}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>Категория: {article.category}</span>
                        <span>Автор: {article.author}</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {article.views || 0}
                        </span>
                        <span>{new Date(article.created_at).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </div>
                    <div className="flex lg:flex-col gap-2">
                      <Link href={`/admin/stati/edit/${article.id}`} className="flex-1 lg:flex-none">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Edit className="w-4 h-4 mr-2" />
                          Редактировать
                        </Button>
                      </Link>
                      <Link href={`/stati/${article.slug}`} target="_blank" className="flex-1 lg:flex-none">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <Eye className="w-4 h-4 mr-2" />
                          Просмотр
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteArticle(article.id)}
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
