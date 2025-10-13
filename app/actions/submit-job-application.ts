"use server"

import { createClient } from "@/lib/supabase/server"

export async function submitJobApplication(formData: FormData) {
  const name = formData.get("name") as string
  const phone = formData.get("phone") as string
  const email = formData.get("email") as string
  const city = formData.get("city") as string
  const age = formData.get("age") as string
  const experience = formData.get("experience") as string
  const message = formData.get("message") as string

  if (!name || !phone || !email || !city || !age) {
    return { success: false, error: "Пожалуйста, заполните все обязательные поля" }
  }

  try {
    // Save to Supabase
    const supabase = await createClient()
    const { error: dbError } = await supabase.from("sever_contact_requests").insert({
      name,
      phone,
      email,
      message: `Отклик на вакансию\nГород: ${city}\nВозраст: ${age}\nОпыт: ${experience || "Не указан"}\nДополнительно: ${message || "Не указано"}`,
      source: "vacancy_application",
      status: "new",
    })

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return { success: false, error: "Ошибка сохранения данных" }
    }

    // Send to Telegram
    const telegramToken = "6465481792:AAFvJieglOSfVL3YUSJh92_k5USt4RvzrDc"
    const chatIds = ["120705872"]

    const telegramMessage = `💼 Новый отклик на вакансию!

👤 Имя: ${name}
📞 Телефон: ${phone}
📧 Email: ${email}
🏙️ Город: ${city}
🎂 Возраст: ${age}

📝 Опыт работы:
${experience || "Не указан"}

💬 Дополнительная информация:
${message || "Не указано"}`

    for (const chatId of chatIds) {
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

      if (!response.ok) {
        console.error("[v0] Telegram API error:", await response.text())
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error submitting job application:", error)
    return { success: false, error: "Произошла ошибка. Попробуйте позже." }
  }
}
