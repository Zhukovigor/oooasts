"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import Image from "next/image"

type OrderModalProps = {
  model: {
    id: string
    name: string
    main_image: string | null
  }
}

export function OrderModal({ model }: OrderModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    comment: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/catalog/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: model.id,
          modelName: model.name,
          ...formData,
        }),
      })

      if (response.ok) {
        alert("Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.")
        setIsOpen(false)
        setFormData({ name: "", phone: "", email: "", comment: "" })
      } else {
        alert("Произошла ошибка. Пожалуйста, попробуйте позже.")
      }
    } catch (error) {
      console.error("[v0] Order submission error:", error)
      alert("Произошла ошибка. Пожалуйста, попробуйте позже.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-lg transition-colors text-lg"
      >
        Заказать
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Оформление заказа</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Model Info */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                {model.main_image && (
                  <div className="relative w-20 h-20 bg-white rounded border flex-shrink-0">
                    <Image
                      src={model.main_image || "/placeholder.svg"}
                      alt={model.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-gray-900">{model.name}</h3>
                  <p className="text-sm text-gray-600">Цена по запросу</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Имя
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Введите имя"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Введите телефон"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Почта
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Введите почту"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Комментарий
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Введите комментарий"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-lg transition-colors text-lg"
              >
                {isSubmitting ? "Отправка..." : "Оформить заказ"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
