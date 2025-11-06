"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface LeadData {
  name: string
  phone: string
  email: string
  message?: string
}

interface SubmissionResult {
  success: boolean
  error?: string
  leadId?: string
}

// Валидация данных
function validateLeadData(data: LeadData): string | null {
  const { name, phone, email } = data

  if (!name?.trim()) return "Имя обязательно для заполнения"
  if (!phone?.trim()) return "Телефон обязателен для заполнения"
  if (!email?.trim()) return "Email обязателен для заполнения"

  // Валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "Неверный формат email"
  }

  // Валидация телефона (базовая)
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return "Неверный формат телефона"
  }

  // Проверка длины
  if (name.length > 100) return "Имя слишком длинное"
  if (phone.length > 20) return "Телефон слишком длинный"
  if (email.length > 100) return "Email слишком длинный"
  if (data.message && data.message.length > 1000) {
    return "Сообщение слишком длинное"
  }

  return null
}

// Очистка данных
function sanitizeLeadData(data: LeadData): LeadData {
  return {
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    message: data.message?.trim() || "Заявка с сайта"
  }
}

export async function submitLead(formData: FormData): Promise<SubmissionResult>
export async function submitLead(leadData: LeadData): Promise<SubmissionResult>
export async function submitLead(data: FormData | LeadData): Promise<SubmissionResult> {
  // Обработка FormData
  let leadData: LeadData
  if (data instanceof FormData) {
    leadData = {
      name: data.get('name') as string,
      phone: data.get('phone') as string,
      email: data.get('email') as string,
      message: data.get('message') as string
    }
  } else {
    leadData = data
  }

  // Валидация
  const validationError = validateLeadData(leadData)
  if (validationError) {
    console.error("[Lead] Validation error:", validationError)
    return { success: false, error: validationError }
  }

  // Очистка данных
  const sanitizedData = sanitizeLeadData(leadData)
  const { name, phone, email, message } = sanitizedData

  try {
    console.log("[Lead] Submitting lead:", { name, phone: "***", email: "***" })

    // Сохранение в Supabase
    const supabase = await createClient()
    
    const { data: lead, error: dbError } = await supabase
      .from("sever_contact_requests")
      .insert({
        name,
        phone,
        email,
        message,
        source: "website_footer",
        status: "new",
        ip_address: await getClientIP(),
        user_agent: await getUserAgent()
      })
      .select("id")
      .single()

    if (dbError) {
      console.error("[Lead] Supabase error:", dbError)
      return { 
        success: false, 
        error: "Ошибка сохранения данных. Попробуйте позже." 
      }
    }

    console.log("[Lead] Successfully saved to Supabase, ID:", lead.id)

    // Параллельная отправка уведомлений
    await Promise.allSettled([
      sendConfirmationEmail(sanitizedData),
      sendAdminNotifications(sanitizedData, lead.id)
    ])

    // Ревалидация если нужно
    revalidatePath("/")

    return { 
      success: true, 
      leadId: lead.id 
    }

  } catch (error) {
    console.error("[Lead] General error:", error)
    return { 
      success: false, 
      error: "Произошла непредвиденная ошибка. Попробуйте позже." 
    }
  }
}

// Отправка подтверждения клиенту
async function sendConfirmationEmail(data: LeadData): Promise<void> {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Спасибо за вашу заявку!</h2>
      <p>Мы получили ваши данные и свяжемся с вами в ближайшее время.</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Ваши данные:</h3>
        <p><strong>Имя:</strong> ${data.name}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.message ? `<p><strong>Сообщение:</strong> ${data.message}</p>` : ''}
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Это автоматическое уведомление, пожалуйста, не отвечайте на это письмо.
      </p>
    </div>
  `

  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.email,
        subject: "Подтверждение получения заявки",
        html: emailHtml
      }),
    })
    console.log("[Lead] Confirmation email sent to:", data.email)
  } catch (error) {
    console.error("[Lead] Failed to send confirmation email:", error)
  }
}

// Уведомления администратору
async function sendAdminNotifications(data: LeadData, leadId: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatIds = process.env.TELEGRAM_CHAT_IDS?.split(",") || []

  const tasks = []

  // Email администратору
  if (adminEmail) {
    const adminEmailHtml = `
      <h2>🔔 Новая заявка с сайта</h2>
      <p><strong>ID заявки:</strong> ${leadId}</p>
      <p><strong>Имя:</strong> ${data.name}</p>
      <p><strong>Телефон:</strong> ${data.phone}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Сообщение:</strong> ${data.message}</p>
      <p><strong>Источник:</strong> website_footer</p>
      <p><strong>Время:</strong> ${new Date().toLocaleString('ru-RU')}</p>
    `

    tasks.push(
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: adminEmail,
          subject: `📥 Новая заявка: ${data.name}`,
          html: adminEmailHtml
        }),
      }).catch(error => {
        console.error("[Lead] Admin email error:", error)
      })
    )
  }

  // Telegram уведомления
  if (telegramToken && telegramChatIds.length > 0) {
    const telegramMessage = `🔔 *Новая заявка с сайта*

📋 *ID:* ${leadId}
👤 *Имя:* ${data.name}
📞 *Телефон:* \`${data.phone}\`
📧 *Email:* ${data.email}
💬 *Сообщение:* ${data.message}

⏰ *Время:* ${new Date().toLocaleString('ru-RU')}`

    for (const chatId of telegramChatIds) {
      tasks.push(
        fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId.trim(),
            text: telegramMessage,
            parse_mode: "Markdown"
          }),
        })
        .then(async response => {
          const result = await response.json()
          if (!response.ok) {
            console.error("[Lead] Telegram error:", result)
          } else {
            console.log("[Lead] Telegram notification sent to:", chatId)
          }
        })
        .catch(error => {
          console.error("[Lead] Telegram fetch error:", error)
        })
      )
    }
  }

  // Ожидаем завершения всех уведомлений
  await Promise.allSettled(tasks)
}

// Вспомогательные функции
async function getClientIP(): Promise<string | null> {
  // В реальном приложении получаем IP из заголовков
  // Для server actions это требует дополнительной настройки
  return null
}

async function getUserAgent(): Promise<string | null> {
  // Аналогично для user agent
  return null
}
