"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trash2, Edit, Eye, EyeOff } from "lucide-react"

interface Advertisement {
  id: string
  title: string
  description: string
  image_url: string
  button_text: string
  button_url: string
  is_active: boolean
  start_date: string
  end_date: string
  display_duration_seconds: number
  close_delay_seconds: number
  max_shows_per_day: number
  shows_today: number
  total_views: number
  total_clicks: number
  created_at: string
}

export default function AdvertisementsListClient() {
  const [ads, setAds] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadAds()
  }, [])

  const loadAds = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setAds(data || [])
    } catch (error) {
      console.error("Error loading ads:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("advertisements").update({ is_active: !isActive }).eq("id", id)

      if (error) throw error
      setAds(ads.map((ad) => (ad.id === id ? { ...ad, is_active: !isActive } : ad)))
    } catch (error) {
      console.error("Error updating ad:", error)
    }
  }

  const deleteAd = async (id: string) => {
    if (!confirm("Вы уверены? Это действие нельзя отменить.")) return

    try {
      const { error } = await supabase.from("advertisements").delete().eq("id", id)

      if (error) throw error
      setAds(ads.filter((ad) => ad.id !== id))
    } catch (error) {
      console.error("Error deleting ad:", error)
    }
  }

  if (isLoading) {
    return <div className="p-6 text-center">Загрузка...</div>
  }

  if (ads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600 mb-4">Рекламы еще не добавлены</p>
        <Link href="/admin/advertisements/new">
          <Button className="bg-blue-600 hover:bg-blue-700">Добавить первую рекламу</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Название</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Статус</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Период показа</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Просмотры</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Клики</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Действия</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {ad.image_url && (
                      <img
                        src={ad.image_url || "/placeholder.svg"}
                        alt={ad.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{ad.title}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{ad.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                      ad.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ad.is_active ? "Активна" : "Неактивна"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {ad.start_date ? new Date(ad.start_date).toLocaleDateString("ru-RU") : "Сразу"} —
                  {ad.end_date ? " " + new Date(ad.end_date).toLocaleDateString("ru-RU") : " Всегда"}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{ad.total_views}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{ad.total_clicks}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => toggleActive(ad.id, ad.is_active)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                    >
                      {ad.is_active ? (
                        <Eye className="w-4 h-4 text-blue-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <Link href={`/admin/advertisements/${ad.id}/edit`}>
                      <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                    </Link>
                    <button onClick={() => deleteAd(ad.id)} className="p-2 hover:bg-red-100 rounded transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
