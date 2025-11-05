"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff, Save, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface NotificationSettings {
  id: string
  telegram_enabled: boolean
  telegram_bot_token: string
  telegram_chat_id: string
  email_enabled: boolean
  email_provider: string
  email_from_address: string
  email_from_name: string
  smtp_host: string
  smtp_port: number
  smtp_username: string
  smtp_password: string
  send_to_email_on_equipment_request: boolean
  send_to_email_on_leasing_request: boolean
  send_to_email_on_catalog_order: boolean
  send_to_email_on_job_application: boolean
  admin_email: string
}

export default function NotificationsEditClient({ settings }: { settings: NotificationSettings }) {
  const [formData, setFormData] = useState(settings)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (field: keyof NotificationSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/notifications/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Настройки уведомлений успешно сохранены!",
        })
      } else {
        setMessage({
          type: "error",
          text: data.error || "Ошибка при сохранении",
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Произошла ошибка при сохранении",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Управление уведомлениями</h1>
          <p className="text-lg text-gray-600 mb-8">Настройте параметры отправки уведомлений на Telegram и Email</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Tabs defaultValue="telegram" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="telegram">Telegram</TabsTrigger>
                <TabsTrigger value="email">Email (SMTP)</TabsTrigger>
                <TabsTrigger value="notifications">Типы уведомлений</TabsTrigger>
              </TabsList>

              {/* Telegram Tab */}
              <TabsContent value="telegram" className="space-y-6 bg-white p-6 rounded-lg mt-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Создайте Telegram бота через @BotFather и получите токен и ID чата
                    </span>
                  </div>
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    BotFather
                  </a>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Telegram Бот Токен *</label>
                  <Input
                    type="password"
                    value={formData.telegram_bot_token}
                    onChange={(e) => handleChange("telegram_bot_token", e.target.value)}
                    placeholder="6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ID Чата Telegram *</label>
                  <Input
                    type="text"
                    value={formData.telegram_chat_id}
                    onChange={(e) => handleChange("telegram_chat_id", e.target.value)}
                    placeholder="120705872"
                    className="w-full"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="telegram_enabled"
                    checked={formData.telegram_enabled}
                    onCheckedChange={(checked) => handleChange("telegram_enabled", checked)}
                  />
                  <label htmlFor="telegram_enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Включить отправку уведомлений в Telegram
                  </label>
                </div>
              </TabsContent>

              {/* Email Tab */}
              <TabsContent value="email" className="space-y-6 bg-white p-6 rounded-lg mt-6">
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm text-amber-700">Email уведомления отправляются через SMTP сервер</span>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="email_enabled"
                    checked={formData.email_enabled}
                    onCheckedChange={(checked) => handleChange("email_enabled", checked)}
                  />
                  <label htmlFor="email_enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Включить отправку email уведомлений
                  </label>
                </div>

                {formData.email_enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Адрес "От" для email *</label>
                      <Input
                        type="email"
                        value={formData.email_from_address}
                        onChange={(e) => handleChange("email_from_address", e.target.value)}
                        placeholder="noreply@example.com"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Имя отправителя</label>
                      <Input
                        type="text"
                        value={formData.email_from_name}
                        onChange={(e) => handleChange("email_from_name", e.target.value)}
                        placeholder="ООО АСТС"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Admin Email (для получения уведомлений)
                      </label>
                      <Input
                        type="email"
                        value={formData.admin_email}
                        onChange={(e) => handleChange("admin_email", e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full"
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">SMTP Параметры</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Хост *</label>
                          <Input
                            type="text"
                            value={formData.smtp_host}
                            onChange={(e) => handleChange("smtp_host", e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Порт *</label>
                          <Input
                            type="number"
                            value={formData.smtp_port}
                            onChange={(e) => handleChange("smtp_port", Number.parseInt(e.target.value))}
                            placeholder="587"
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Пользователь *</label>
                          <Input
                            type="text"
                            value={formData.smtp_username}
                            onChange={(e) => handleChange("smtp_username", e.target.value)}
                            placeholder="your-email@gmail.com"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Пароль *</label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={formData.smtp_password}
                              onChange={(e) => handleChange("smtp_password", e.target.value)}
                              placeholder="Ваш пароль от приложения"
                              className="w-full pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Notification Types Tab */}
              <TabsContent value="notifications" className="space-y-6 bg-white p-6 rounded-lg mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Типы уведомлений для отправки по Email</h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="equipment_request"
                      checked={formData.send_to_email_on_equipment_request}
                      onCheckedChange={(checked) => handleChange("send_to_email_on_equipment_request", checked)}
                    />
                    <label htmlFor="equipment_request" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Заявки на технику
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="leasing_request"
                      checked={formData.send_to_email_on_leasing_request}
                      onCheckedChange={(checked) => handleChange("send_to_email_on_leasing_request", checked)}
                    />
                    <label htmlFor="leasing_request" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Заявки на лизинг
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="catalog_order"
                      checked={formData.send_to_email_on_catalog_order}
                      onCheckedChange={(checked) => handleChange("send_to_email_on_catalog_order", checked)}
                    />
                    <label htmlFor="catalog_order" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Заказы из каталога
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Checkbox
                      id="job_application"
                      checked={formData.send_to_email_on_job_application}
                      onCheckedChange={(checked) => handleChange("send_to_email_on_job_application", checked)}
                    />
                    <label htmlFor="job_application" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Отклики на вакансии
                    </label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 flex items-center gap-2"
              >
                <Save size={18} />
                {isSubmitting ? "Сохранение..." : "Сохранить настройки"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
