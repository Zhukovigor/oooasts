"use server"

import { createClient } from "@/lib/supabase/server"

interface LeasingResult {
  success: boolean
  error?: string
  leadId?: string
}

export async function submitLeasingRequest(formData: FormData): Promise<LeasingResult> {
  const name = formData.get("name") as string
  const company = formData.get("company") as string
  const phone = formData.get("phone") as string
  const email = formData.get("email") as string
  const equipment = formData.get("equipment") as string
  const message = formData.get("message") as string

  console.log("🔍 [LEASING] Starting leasing request...")

  if (!name || !company || !phone || !email) {
    console.log("❌ [LEASING] Validation failed - missing required fields")
    return { success: false, error: "Пожалуйста, заполните все обязательные поля" }
  }

  try {
    // Save to Supabase
    const supabase = await createClient()
    console.log("🔍 [LEASING] Inserting into database...")
    
    const { data: lead, error: dbError } = await supabase
      .from("sever_contact_requests")
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
        equipment_model: equipment?.trim() || "Не указано",
        message: message?.trim() || "Заявка на лизинг",
        source: "leasing_page",
        status: "new",
        created_at: new Date().toISOString()
      })
      .select("id")
      .single()

    if (dbError) {
      console.error("❌ [LEASING] Database error:", dbError)
      return { success: false, error: "Ошибка сохранения данных" }
    }

    console.log("✅ [LEASING] Saved to database, ID:", lead.id)

    // Send notifications
    await sendLeasingNotifications({ name, company, phone, email, equipment, message }, lead.id)

    return { success: true, leadId: lead.id }
    
  } catch (error) {
    console.error("❌ [LEASING] General error:", error)
    return { success: false, error: "Произошла ошибка. Попробуйте позже." }
  }
}

// Функция для отправки уведомлений
async function sendLeasingNotifications(data: {
  name: string
  company: string
  phone: string
  email: string
  equipment?: string
  message?: string
}, leadId: string) {
  
  try {
    // 1. Email клиенту
    await sendLeasingConfirmationEmail(data)
    
    // 2. Email администратору
    await sendLeasingAdminEmail(data, leadId)
    
    // 3. Telegram уведомление
    await sendLeasingTelegramNotification(data, leadId)

  } catch (error) {
    console.error("❌ [LEASING] Notifications error:", error)
  }
}

// Подтверждение клиенту
async function sendLeasingConfirmationEmail(data: {
  name: string
  company: string
  phone: string
  email: string
  equipment?: string
  message?: string
}): Promise<void> {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">Спасибо за вашу заявку на лизинг!</h2>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Детали вашей заявки:</h3>
        <p><strong>👤 Имя:</strong> ${data.name}</p>
        <p><strong>🏢 Компания:</strong> ${data.company}</p>
        <p><strong>📞 Телефон:</strong> ${data.phone}</p>
        <p><strong>📧 Email:</strong> ${data.email}</p>
        <p><strong>🚜 Модель техники:</strong> ${data.equipment || "Не указано"}</p>
        ${data.message ? `<p><strong>💬 Сообщение:</strong> ${data.message}</p>` : ''}
      </div>
      
      <p>Наш специалист свяжется с вами в ближайшее время для обсуждения условий лизинга.</p>
    </div>
  `

  try {
    const response = await fetch(`${getBaseUrl()}/api/notifications/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.email,
        subject: "Ваша заявка на лизинг получена",
        html: emailHtml
      }),
    })

    if (!response.ok) {
      console.error("❌ [LEASING_EMAIL] Failed to send confirmation")
    } else {
      console.log("✅ [LEASING_EMAIL] Confirmation sent to client")
    }
  } catch (error) {
    console.error("❌ [LEASING_EMAIL] Error:", error)
  }
}

// Уведомление администратору
async function sendLeasingAdminEmail(data: {
  name: string
  company: string
  phone: string
  email: string
  equipment?: string
  message?: string
}, leadId: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  
  if (!adminEmail) {
    console.log("⚠️ [LEASING_ADMIN] ADMIN_EMAIL not configured")
    return
  }

  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">🔔 Новая заявка на ЛИЗИНГ</h2>
      
      <div style="background: #fef2f2; padding: 15px; border-radius: 5px;">
        <p><strong>📋 ID заявки:</strong> ${leadId}</p>
        <p><strong>👤 Имя:</strong> ${data.name}</p>
        <p><strong>🏢 Компания:</strong> ${data.company}</p>
        <p><strong>📞 Телефон:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
        <p><strong>📧 Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>🚜 Модель техники:</strong> ${data.equipment || "Не указано"}</p>
        <p><strong>💬 Сообщение:</strong> ${data.message || "Не указано"}</p>
        <p><strong>🌐 Источник:</strong> leasing_page</p>
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
        subject: `📥 Новая заявка на лизинг: ${data.company}`,
        html: adminEmailHtml
      }),
    })

    if (!response.ok) {
      console.error("❌ [LEASING_ADMIN] Failed to send to admin")
    } else {
      console.log("✅ [LEASING_ADMIN] Notification sent to admin")
    }
  } catch (error) {
    console.error("❌ [LEASING_ADMIN] Error:", error)
  }
}

// Telegram уведомление (используем подход из рабочего кода)
async function sendLeasingTelegramNotification(data: {
  name: string
  company: string
  phone: string
  email: string
  equipment?: string
  message?: string
}, leadId: string): Promise<void> {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatIds = process.env.TELEGRAM_CHAT_IDS?.split(",").map(id => id.trim()).filter(id => id) || []

  console.log("🔍 [LEASING_TELEGRAM] Configuration:", {
    hasToken: !!telegramBotToken,
    chatIdsCount: telegramChatIds.length
  })

  if (!telegramBotToken) {
    console.error("❌ [LEASING_TELEGRAM] TELEGRAM_BOT_TOKEN not set")
    return
  }

  if (telegramChatIds.length === 0) {
    console.error("❌ [LEASING_TELEGRAM] TELEGRAM_CHAT_IDS not set")
    return
  }

  // Сообщение в стиле рабочего кода из каталога
  const message = `
🆕 Новая заявка на ЛИЗИНГ!

👤 Имя: ${data.name}
🏢 Компания: ${data.company}
📞 Телефон: ${data.phone}
📧 Email: ${data.email}
🚜 Модель техники: ${data.equipment || "Не указано"}
💬 Сообщение: ${data.message || "Не указано"}

🆔 ID заявки: ${leadId}
⏰ Время: ${new Date().toLocaleString('ru-RU')}
  `.trim()

  let successCount = 0

  for (const chatId of telegramChatIds) {
    try {
      console.log(`🔍 [LEASING_TELEGRAM] Sending to chat ${chatId}...`)
      
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML", // Используем HTML как в рабочем коде
        }),
      })

      const result = await response.json()
      
      if (response.ok) {
        console.log(`✅ [LEASING_TELEGRAM] Successfully sent to ${chatId}`)
        successCount++
      } else {
        console.error(`❌ [LEASING_TELEGRAM] API error for ${chatId}:`, {
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
          console.log(`✅ [LEASING_TELEGRAM] Sent to ${chatId} (without HTML)`)
          successCount++
        }
      }
    } catch (error) {
      console.error(`❌ [LEASING_TELEGRAM] Network error for ${chatId}:`, error)
    }
  }

  console.log(`📊 [LEASING_TELEGRAM] Sent ${successCount}/${telegramChatIds.length} messages`)
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
