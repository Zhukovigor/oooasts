"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@supabase/ssr"

interface Settings {
  bot_token: string
  channel_id: number | string
  channel_username?: string
  is_active: boolean
}

interface QueueItem {
  id: string
  content_type: string
  title: string
  description?: string
  status: "pending" | "sent" | "failed"
  error_message?: string
  created_at: string
  sent_at?: string
}

export default function PostingClient() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Settings>({
    bot_token: "",
    channel_id: "",
    is_active: false,
  })
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadSettings()
    loadQueue()
  }, [])

  async function loadSettings() {
    try {
      const { data } = await supabase.from("telegram_posting_settings").select("*").limit(1).single()

      if (data) {
        setSettings(data)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadQueue() {
    try {
      const { data } = await supabase
        .from("posting_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (data) {
        setQueue(data)
      }
    } catch (error) {
      console.error("Error loading queue:", error)
    }
  }

  async function handleSaveSettings() {
    setSaving(true)
    setMessage(null)

    try {
      const { data: existing } = await supabase.from("telegram_posting_settings").select("id").limit(1).single()

      if (existing) {
        await supabase.from("telegram_posting_settings").update(settings).eq("id", existing.id)
      } else {
        await supabase.from("telegram_posting_settings").insert(settings)
      }

      setMessage({ type: "success", text: "Настройки сохранены успешно!" })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      setMessage({ type: "error", text: "Ошибка при сохранении настроек" })
    } finally {
      setSaving(false)
    }
  }

  async function handleTestConnection() {
    setTesting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/telegram/post-to-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Тестовое сообщение",
          description: "Это тестовое сообщение из системы постинга ООО АСТС",
          channelId: settings.channel_id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Тестовое сообщение успешно отправлено!" })
      } else {
        setMessage({ type: "error", text: `Ошибка: ${data.error}` })
      }
    } catch (error: any) {
      console.error("Error testing connection:", error)
      setMessage({ type: "error", text: "Ошибка при отправке тестового сообщения" })
    } finally {
      setTesting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>
  }

  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="settings">Настройки</TabsTrigger>
        <TabsTrigger value="queue">Очередь постинга ({queue.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Telegram Bot Token</label>
              <Input
                type="password"
                value={settings.bot_token}
                onChange={(e) => setSettings({ ...settings, bot_token: e.target.value })}
                placeholder="6816923933:AAHWM79Z6PfpvKVjZh793f_HrPe9ds6ajDM"
              />
              <p className="text-sm text-gray-500 mt-1">Получите токен у @BotFather в Telegram</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Chat ID канала</label>
              <Input
                value={settings.channel_id}
                onChange={(e) => setSettings({ ...settings, channel_id: e.target.value })}
                placeholder="-1002080159369"
              />
              <p className="text-sm text-gray-500 mt-1">Отрицательный ID (например: -1002080159369)</p>
            </div>

            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={settings.is_active}
                onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium text-gray-900">Активировать постинг</label>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg ${
                  message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSaveSettings} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? "Сохранение..." : "Сохранить настройки"}
              </Button>
              <Button onClick={handleTestConnection} disabled={testing} variant="outline">
                {testing ? "Отправка..." : "Проверить подключение"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="queue" className="space-y-6">
        <Card>
          <CardContent className="p-6">
            {queue.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Очередь постинга пуста</div>
            ) : (
              <div className="space-y-3">
                {queue.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(item.status)}`}>
                          {item.status === "sent"
                            ? "✓ Отправлено"
                            : item.status === "failed"
                              ? "✗ Ошибка"
                              : "⏳ Ожидание"}
                        </span>
                        <span className="text-xs text-gray-500">{item.content_type}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                      {item.error_message && <p className="text-sm text-red-600 mt-1">Ошибка: {item.error_message}</p>}
                      <p className="text-xs text-gray-500 mt-2">{new Date(item.created_at).toLocaleString("ru-RU")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
