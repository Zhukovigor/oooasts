"use server"

import { createClient } from "@/lib/supabase/server"

interface LeadData {
  name: string
  phone: string
  email: string
  message: string
}

export async function submitLead(data: LeadData) {
  const { name, phone, email, message } = data

  if (!name || !phone || !email) {
    return { success: false, error: "Пожалуйста, заполните все обязательные поля" }
  }

  try {
    console.log("[v0] Submitting lead:", { name, phone, email })

    // Save to Supabase
    const supabase = await createClient()
    const { error: dbError } = await supabase.from("sever_contact_requests").insert({
      name,
      phone,
      email,
      message: message || "Заявка с сайта",
      source: "website_footer",
      status: "new",
    })

    if (dbError) {
      console.log("[v0] Supabase error:", dbError)
      return { success: false, error: "Ошибка сохранения данных" }
    }

    console.log("[v0] Saved to Supabase successfully")

    const telegramToken = "6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"
    const chatIds = ["120705872"]

    const telegramMessage = `🔔 Новая заявка с сайта:

👤 Имя: ${name}
📞 Телефон: ${phone}
📧 Email: ${email}
💬 Сообщение: ${message || "Не указано"}`

    for (const chatId of chatIds) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
          }),
        })

        const result = await response.json()
        console.log("[v0] Telegram response:", result)

        if (!response.ok) {
          console.log("[v0] Telegram error:", result)
        }
      } catch (telegramError) {
        console.log("[v0] Telegram fetch error:", telegramError)
        // Don't fail the whole request if Telegram fails
      }
    }

    return { success: true }
  } catch (error) {
    console.log("[v0] General error:", error)
    return { success: false, error: "Произошла ошибка. Попробуйте позже." }
  }
}
