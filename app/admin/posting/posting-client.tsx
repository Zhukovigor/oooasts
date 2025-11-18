"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@supabase/ssr"

interface TelegramChannel {
  id: string
  bot_token: string
  channel_id: string // Changed from bigint to string for JSON serialization
  channel_name: string
  is_active: boolean
  created_at: string
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
  const [channels, setChannels] = useState<TelegramChannel[]>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [newChannel, setNewChannel] = useState({ name: "", token: "", channelId: "" })
  const [addingChannel, setAddingChannel] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadChannels()
    loadQueue()
  }, [])

  async function loadChannels() {
    try {
      const { data } = await supabase
        .from("telegram_posting_settings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (data) {
        setChannels(data)
        setSelectedChannels(data.map((ch) => ch.id))
      }
    } catch (error) {
      console.error("[v0] Error loading channels:", error)
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
      console.error("[v0] Error loading queue:", error)
    }
  }

  async function handleAddChannel() {
    if (!newChannel.name || !newChannel.token || !newChannel.channelId) {
      setMessage({ type: "error", text: "Заполните все поля" })
      return
    }

    setAddingChannel(true)
    setMessage(null)

    try {
      const { error } = await supabase.from("telegram_posting_settings").insert({
        channel_name: newChannel.name,
        bot_token: newChannel.token,
        channel_id: newChannel.channelId, // Send as string, database converts it
        is_active: true,
      })

      if (error) throw error

      setMessage({ type: "success", text: "Канал добавлен успешно!" })
      setNewChannel({ name: "", token: "", channelId: "" })
      loadChannels()
    } catch (error: any) {
      console.error("[v0] Error adding channel:", error)
      setMessage({ type: "error", text: "Ошибка при добавлении канала" })
    } finally {
      setAddingChannel(false)
    }
  }

  async function handleDeleteChannel(channelId: string) {
    try {
      await supabase.from("telegram_posting_settings").delete().eq("id", channelId)
      setMessage({ type: "success", text: "Канал удалён" })
      loadChannels()
    } catch (error: any) {
      console.error("[v0] Error deleting channel:", error)
      setMessage({ type: "error", text: "Ошибка при удалении канала" })
    }
  }

  function toggleChannel(channelId: string) {
    setSelectedChannels((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId]
    )
  }

  async function handleTestConnection() {
    if (selectedChannels.length === 0) {
      setMessage({ type: "error", text: "Выберите хотя бы один канал" })
      return
    }

    setTesting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/telegram/post-to-channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Тестовое сообщение",
          description: "Это тестовое сообщение из системы постинга ООО АСТС",
          contentType: "test",
          contentId: "test-" + Date.now(),
          channelIds: selectedChannels,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const successCount = data.results.filter((r: any) => r.success).length
        setMessage({
          type: "success",
          text: `Тестовое сообщение отправлено в ${successCount} канал(ов)!`,
        })
      } else {
        setMessage({ type: "error", text: "Ошибка при отправке тестового сообщения" })
      }
    } catch (error: any) {
      console.error("[v0] Error testing connection:", error)
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
    <Tabs defaultValue="channels" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="channels">Каналы ({channels.length})</TabsTrigger>
        <TabsTrigger value="selection">Выбор для постинга</TabsTrigger>
        <TabsTrigger value="queue">Очередь ({queue.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="channels" className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Добавить новый канал</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Название канала"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                />
                <Input
                  type="password"
                  placeholder="Bot Token"
                  value={newChannel.token}
                  onChange={(e) => setNewChannel({ ...newChannel, token: e.target.value })}
                />
                <Input
                  placeholder="Channel ID (например: -1002080159369)"
                  value={newChannel.channelId}
                  onChange={(e) => setNewChannel({ ...newChannel, channelId: e.target.value })}
                />
                <Button onClick={handleAddChannel} disabled={addingChannel} className="w-full bg-blue-600">
                  {addingChannel ? "Добавление..." : "Добавить канал"}
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Активные каналы</h3>
              {channels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Нет активных каналов</div>
              ) : (
                <div className="space-y-3">
                  {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{channel.channel_name}</p>
                        <p className="text-sm text-gray-600">ID: {channel.channel_id}</p>
                      </div>
                      <Button
                        onClick={() => handleDeleteChannel(channel.id)}
                        variant="outline"
                        className="text-red-600"
                      >
                        Удалить
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="selection" className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <h3 className="font-semibold text-lg">Выберите каналы для постинга</h3>
            {channels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Нет доступных каналов</div>
            ) : (
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center gap-3 p-4 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(channel.id)}
                      onChange={() => toggleChannel(channel.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{channel.channel_name}</p>
                      <p className="text-sm text-gray-600">ID: {channel.channel_id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleTestConnection}
                disabled={testing || selectedChannels.length === 0}
                className="flex-1 bg-blue-600"
              >
                {testing ? "Отправка..." : "Проверить выбранные каналы"}
              </Button>
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
