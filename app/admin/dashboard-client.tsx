"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileText, Package } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"

interface Stats {
  totalArticles: number
  publishedArticles: number
  totalEquipment: number
  activeEquipment: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    publishedArticles: 0,
    totalEquipment: 0,
    activeEquipment: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      try {
        // Fetch articles stats
        const { count: totalArticles } = await supabase.from("articles").select("*", { count: "exact", head: true })

        const { count: publishedArticles } = await supabase
          .from("articles")
          .select("*", { count: "exact", head: true })
          .eq("status", "published")

        // Fetch equipment stats
        const { count: totalEquipment } = await supabase
          .from("catalog_models")
          .select("*", { count: "exact", head: true })

        const { count: activeEquipment } = await supabase
          .from("catalog_models")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)

        setStats({
          totalArticles: totalArticles || 0,
          publishedArticles: publishedArticles || 0,
          totalEquipment: totalEquipment || 0,
          activeEquipment: activeEquipment || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Всего статей",
      value: stats.totalArticles,
      subtitle: `${stats.publishedArticles} опубликовано`,
      icon: FileText,
      color: "blue",
    },
    {
      title: "Спецтехника",
      value: stats.totalEquipment,
      subtitle: `${stats.activeEquipment} активных`,
      icon: Package,
      color: "green",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Панель управления</h1>
        <p className="text-gray-600 mt-2">Добро пожаловать в админ панель ООО АСТС</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{loading ? "..." : stat.value}</h3>
                <p className="text-sm font-medium text-gray-600 mt-1">{stat.title}</p>
                <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <a href="/admin/stati/new" className="block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Создать статью</h3>
                    <p className="text-sm text-gray-600">Добавить новую статью на сайт</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <a href="/admin/equipment/new" className="block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Добавить технику</h3>
                    <p className="text-sm text-gray-600">Добавить новую спецтехнику в каталог</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
