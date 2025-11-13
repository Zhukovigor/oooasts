"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export function AutoPostingClient() {
  const [isScanning, setIsScanning] = useState(false)
  const [lastScan, setLastScan] = useState<string | null>(null)

  useEffect(() => {
    fetchLastScan()
  }, [])

  const fetchLastScan = async () => {
    try {
      const { data } = await supabase
        .from("posted_content_tracking")
        .select("posted_at")
        .order("posted_at", { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setLastScan(new Date(data.posted_at).toLocaleString("ru-RU"))
      }
    } catch (error) {
      console.error("Error fetching last scan:", error)
    }
  }

  const handleManualScan = async () => {
    setIsScanning(true)
    try {
      const response = await fetch("/api/cron/auto-post-content", {
        method: "GET",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Успешно",
          description: `Опубликовано ${result.totalPosted} новых элементов`,
        })
        fetchLastScan()
      } else {
        toast({
          title: "Ошибка",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить сканирование",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Автоматический постинг</h3>
        <p className="text-sm text-blue-800 mb-4">
          Система автоматически сканирует каталог, статьи и объявления, и публикует новый контент в Telegram канал.
        </p>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">
              Последнее сканирование: <strong>{lastScan || "Еще не выполнено"}</strong>
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Рекомендуется устанавливать внешнее сканирование через Vercel Cron:
            </p>
            <code className="block bg-white p-2 rounded text-xs overflow-auto">
              https://volgograd-asts.vercel.app/api/cron/auto-post-content
            </code>
          </div>

          <Button onClick={handleManualScan} disabled={isScanning} className="w-full">
            {isScanning ? "Сканирование..." : "Запустить сканирование вручную"}
          </Button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Как настроить автоматическое сканирование?</h4>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>Установите Telegram бота и ID канала в разделе "Настройки"</li>
          <li>Скопируйте URL: {typeof window !== "undefined" && window.location.origin}/api/cron/auto-post-content</li>
          <li>Используйте внешний сервис для регулярного вызова (например, EasyCron, cron-job.org или Vercel Cron):</li>
          <li>Система будет автоматически публиковать новый контент в Telegram</li>
        </ol>
      </div>
    </div>
  )
}
