"use server"

import { createClient } from "@/lib/supabase/server"

export async function submitLeasingRequest(formData: FormData) {
  const name = formData.get("name") as string
  const company = formData.get("company") as string
  const phone = formData.get("phone") as string
  const email = formData.get("email") as string
  const equipment = formData.get("equipment") as string
  const message = formData.get("message") as string

  if (!name || !company || !phone || !email) {
    return { success: false, error: "Пожалуйста, заполните все обязательные поля" }
  }

  try {
    // Save to Supabase
    const supabase = await createClient()
    const { error: dbError } = await supabase.from("sever_contact_requests").insert({
      name,
      phone,
      email,
      company,
      equipment_model: equipment || "Не указано",
      message: message || "Заявка на лизинг",
      source: "leasing_page",
      status: "new",
    })

    if (dbError) {
      return { success: false, error: "Ошибка сохранения данных" }
    }

    // Send to Telegram
    const telegramToken = "6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"
    const chatIds = ["120705872"]

    const telegramMessage = `🔔 Новая заявка на ЛИЗИНГ:

👤 Имя: ${name}
🏢 Компания: ${company}
📞 Телефон: ${phone}
📧 Email: ${email}
🚜 Модель техники: ${equipment || "Не указано"}
💬 Сообщение: ${message || "Не указано"}`

    for (const chatId of chatIds) {
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
        }),
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Произошла ошибка. Попробуйте позже." }
  }
}
