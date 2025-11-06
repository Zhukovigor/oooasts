"use server"

import { createClient } from "@/lib/supabase/server"

interface JobApplicationResult {
  success: boolean
  error?: string
  leadId?: string
}

export async function submitJobApplication(formData: FormData): Promise<JobApplicationResult> {
  const name = formData.get("name") as string
  const phone = formData.get("phone") as string
  const email = formData.get("email") as string
  const city = formData.get("city") as string
  const age = formData.get("age") as string
  const experience = formData.get("experience") as string
  const message = formData.get("message") as string

  console.log("🔍 [JOB] Starting job application...")

  if (!name || !phone || !email || !city || !age) {
    console.log("❌ [JOB] Validation failed - missing required fields")
    return { success: false, error: "Пожалуйста, заполните все обязательные поля" }
  }

  try {
    // Save to Supabase
    const supabase = await createClient()
    console.log("🔍 [JOB] Inserting into database...")
    
    const { data: lead, error: dbError } = await supabase
      .from("sever_contact_requests")
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        message: `Отклик на вакансию\nГород: ${city}\nВозраст: ${age}\nОпыт: ${experience || "Не указан"}\nДополнительно: ${message || "Не указано"}`,
        source: "vacancy_application",
        status: "new",
        created_at: new Date().toISOString()
      })
      .select("id")
      .single()

    if (dbError) {
      console.error("❌ [JOB] Database error:", dbError)
      return { success: false, error: "Ошибка сохранения данных" }
    }

    console.log("✅ [JOB] Saved to database, ID:", lead.id)

    // Send notifications
    await sendJobApplicationNotifications({
      name, phone, email, city, age, experience, message
    }, lead.id)

    return { success: true, leadId: lead.id }
    
  } catch (error) {
    console.error("❌ [JOB] General error:", error)
    return { success: false, error: "Произошла ошибка. Попробуйте позже." }
  }
}

// Функция для отправки уведомлений
async function sendJobApplicationNotifications(data: {
  name: string
  phone: string
  email: string
  city: string
  age: string
  experience?: string
  message?: string
}, leadId: string) {
  
  try {
    // 1. Email подтверждение кандидату
    await sendJobConfirmationEmail(data)
    
    // 2. Email HR/администратору
    await sendJobAdminEmail(data, leadId)
    
    // 3. Telegram уведомление
    await sendJobTelegramNotification(data, leadId)

  } catch (error) {
    console.error("❌ [JOB] Notifications error:", error)
  }
}

// Подтверждение кандидату
async function sendJobConfirmationEmail(data: {
  name: string
  phone: string
  email: string
  city: string
  age: string
  experience?: string
  message?: string
}): Promise<void> {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">Спасибо за ваш отклик на вакансию!</h2>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Ваши данные:</h3>
        <p><strong>👤 Имя:</strong> ${data.name}</p>
        <p><strong>📞 Телефон:</strong> ${data.phone}</p>
        <p><strong>📧 Email:</strong> ${data.email}</p>
        <p><strong>🏙️ Город:</strong> ${data.city}</p>
        <p><strong>🎂 Возраст:</strong> ${data.age}</p>
        <p><strong>💼 Опыт работы:</strong> ${data.experience || "Не указан"}</p>
        ${data.message ? `<p><strong>💬 Дополнительно:</strong> ${data.message}</p>` : ''}
      </div>
      
      <p>Мы рассмотрим вашу кандидатуру и свяжемся с вами в ближайшее время.</p>
    </div>
  `

  try {
    const response = await fetch(`${getBaseUrl()}/api/notifications/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.email,
        subject: "Спасибо за ваш отклик на вакансию",
        html: emailHtml
      }),
    })

    if (!response.ok) {
      console.error("❌ [JOB_EMAIL] Failed to send confirmation")
    } else {
      console.log("✅ [JOB_EMAIL] Confirmation sent to candidate")
    }
  } catch (error) {
    console.error("❌ [JOB_EMAIL] Error:", error)
  }
}

// Уведомление HR/администратору
async function sendJobAdminEmail(data: {
  name: string
  phone: string
  email: string
  city: string
  age: string
  experience?: string
  message?: string
}, leadId: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  
  if (!adminEmail) {
    console.log("⚠️ [JOB_ADMIN] ADMIN_EMAIL not configured")
    return
  }

  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">💼 Новый отклик на вакансию</h2>
      
      <div style="background: #fef2f2; padding: 15px; border-radius: 5px;">
        <p><strong>📋 ID отклика:</strong> ${leadId}</p>
        <p><strong>👤 Имя:</strong> ${data.name}</p>
        <p><strong>📞 Телефон:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
        <p><strong>📧 Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>🏙️ Город:</strong> ${data.city}</p>
        <p><strong>🎂 Возраст:</strong> ${data.age}</p>
        <p><strong>💼 Опыт работы:</strong> ${data.experience || "Не указан"}</p>
        <p><strong>💬 Дополнительно:</strong> ${data.message || "Не указано"}</p>
        <p><strong>🌐 Источник:</strong> vacancy_application</p>
        <p><strong>⏰ Время:</strong> ${new Date().toLocaleString('ru-RU')}</p>
      </div>
    </div>
  `

  try {
    const response = await fetch(`${getBaseUrl()}/api/notifications/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: adminEmail,
        subject: `📥 Новый отклик на вакансию: ${data.name}`,
        html: adminEmailHtml
      }),
    })

    if (!response.ok) {
      console.error("❌ [JOB_ADMIN] Failed to send to admin")
    } else {
      console.log("✅ [JOB_ADMIN] Notification sent to admin")
    }
  } catch (error) {
    console.error("❌ [JOB_ADMIN] Error:", error)
  }
}

// Telegram уведомление
async function sendJobTelegramNotification(data: {
  name: string
  phone: string
  email: string
  city: string
  age: string
  experience?: string
  message?: string
}, leadId: string): Promise<void> {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatIds = process.env.TELEGRAM_CHAT_IDS?.split(",").map(id => id.trim()).filter(id => id) || []

  console.log("🔍 [JOB_TELEGRAM] Configuration:", {
    hasToken: !!telegramBotToken,
    chatIdsCount: telegramChatIds.length
  })

  if (!telegramBotToken) {
    console.error("❌ [JOB_TELEGRAM] TELEGRAM_BOT_TOKEN not set")
    return
  }

  if (telegramChatIds.length === 0) {
    console.error("❌ [JOB_TELEGRAM] TELEGRAM_CHAT_IDS not set")
    return
  }

  // Сообщение в стиле рабочего кода
  const message = `
💼 Новый отклик на вакансию!

👤 Имя: ${data.name}
📞 Телефон: ${data.phone}
📧 Email: ${data.email}
🏙️ Город: ${data.city}
🎂 Возраст: ${data.age}

💼 Опыт работы:
${data.experience || "Не указан"}

💬 Дополнительно:
${data.message || "Не указано"}

🆔 ID отклика: ${leadId}
⏰ Время: ${new Date().toLocaleString('ru-RU')}
  `.trim()

  let successCount = 0

  for (const chatId of telegramChatIds) {
    try {
      console.log(`🔍 [JOB_TELEGRAM] Sending to chat ${chatId}...`)
      
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        console.log(`✅ [JOB_TELEGRAM] Successfully sent to ${chatId}`)
        successCount++
      } else {
        console.error(`❌ [JOB_TELEGRAM] API error for ${chatId}:`, {
          errorCode: result.error_code,
          description: result.description
        })
        
        // Попробуем без parse_mode
        const simpleResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
          }),
        })
        
        if (simpleResponse.ok) {
          console.log(`✅ [JOB_TELEGRAM] Sent to ${chatId} (without HTML)`)
          successCount++
        }
      }
    } catch (error) {
      console.error(`❌ [JOB_TELEGRAM] Network error for ${chatId}:`, error)
    }
  }

  console.log(`📊 [JOB_TELEGRAM] Sent ${successCount}/${telegramChatIds.length} messages`)
}

// Вспомогательная функция для получения базового URL
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  return 'http://localhost:3000'
}
