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
  const { name, phone, email, message } = data

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
  const cleanPhone = phone.replace(/\s/g, '')
  if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 5) {
    return "Неверный формат телефона"
  }

  // Проверка длины
  if (name.trim().length < 2) return "Имя слишком короткое"
  if (name.length > 100) return "Имя слишком длинное"
  if (phone.length > 20) return "Телефон слишком длинный"
  if (email.length > 100) return "Email слишком длинный"
  if (message && message.length > 1000) {
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
  console.log("🔍 [LEAD] Starting lead submission process...")

  // Обработка FormData
  let leadData: LeadData
  if (data instanceof FormData) {
    leadData = {
      name: (data.get('name') as string) || '',
      phone: (data.get('phone') as string) || '',
      email: (data.get('email') as string) || '',
      message: (data.get('message') as string) || ''
    }
    console.log("🔍 [LEAD] FormData received:", { 
      name: leadData.name ? "***" : "empty",
      phone: leadData.phone ? "***" : "empty", 
      email: leadData.email ? "***" : "empty",
      hasMessage: !!leadData.message
    })
  } else {
    leadData = data
    console.log("🔍 [LEAD] Object data received:", {
      name: leadData.name ? "***" : "empty",
      phone: leadData.phone ? "***" : "empty",
      email: leadData.email ? "***" : "empty",
      hasMessage: !!leadData.message
    })
  }

  // Валидация
  const validationError = validateLeadData(leadData)
  if (validationError) {
    console.error("❌ [LEAD] Validation failed:", validationError)
    return { success: false, error: validationError }
  }

  // Очистка данных
  const sanitizedData = sanitizeLeadData(leadData)
  const { name, phone, email, message } = sanitizedData

  console.log("🔍 [LEAD] Data sanitized, proceeding to database...")

  try {
    // Создаем клиент Supabase
    console.log("🔍 [LEAD] Creating Supabase client...")
    const supabase = await createClient()

    if (!supabase) {
      console.error("❌ [LEAD] Failed to create Supabase client")
      return { success: false, error: "Ошибка подключения к базе данных" }
    }

    // Сохранение в Supabase
    console.log("🔍 [LEAD] Inserting into database...")
    const { data: lead, error: dbError } = await supabase
      .from("sever_contact_requests")
      .insert({
        name,
        phone,
        email,
        message,
        source: "website_footer",
        status: "new",
        created_at: new Date().toISOString()
      })
      .select("id")
      .single()

    if (dbError) {
      console.error("❌ [LEAD] Database insertion error:", {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      })

      // Более понятные сообщения об ошибках
      if (dbError.code === '23505') {
        return { success: false, error: "Заявка с таким email или телефоном уже существует" }
      } else if (dbError.code === '42501') {
        return { success: false, error: "Ошибка прав доступа к базе данных" }
      } else {
        return { success: false, error: "Ошибка сохранения данных в базе" }
      }
    }

    if (!lead) {
      console.error("❌ [LEAD] No lead data returned after insertion")
      return { success: false, error: "Ошибка при создании заявки" }
    }

    console.log("✅ [LEAD] Successfully saved to database, ID:", lead.id)

    // Отправка уведомлений (не блокируем основную операцию)
    console.log("🔍 [LEAD] Starting notification process...")
    sendNotificationsAsync(sanitizedData, lead.id)

    // Ревалидация если нужно
    revalidatePath("/")

    console.log("✅ [LEAD] Lead submission completed successfully")
    return { 
      success: true, 
      leadId: lead.id 
    }

  } catch (error) {
    console.error("❌ [LEAD] Unexpected error:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return { 
      success: false, 
      error: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону." 
    }
  }
}

// Асинхронная отправка уведомлений (не блокирует ответ)
async function sendNotificationsAsync(data: LeadData, leadId: string): Promise<void> {
  try {
    console.log("🔍 [NOTIFICATIONS] Starting async notifications...")
    
    await Promise.allSettled([
      sendConfirmationEmail(data),
      sendAdminEmail(data, leadId),
      sendTelegramNotification(data, leadId)
    ])
    
    console.log("✅ [NOTIFICATIONS] All notifications completed")
  } catch (error) {
    console.error("⚠️ [NOTIFICATIONS] Error in notifications:", error)
    // Не пробрасываем ошибку, т.к. это не критично для основной операции
  }
}

// Отправка подтверждения клиенту
async function sendConfirmationEmail(data: LeadData): Promise<void> {
  if (!process.env.ADMIN_EMAIL) {
    console.log("⚠️ [EMAIL] ADMIN_EMAIL not set, skipping confirmation email")
    return
  }

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #2563eb; text-align: center;">Спасибо за вашу заявку!</h2>
      <p>Уважаемый(ая) <strong>${data.name}</strong>,</p>
      <p>Мы получили ваши данные и свяжемся с вами в ближайшее время для уточнения деталей.</p>
      
      <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="margin-top: 0; color: #1e293b;">Ваши данные:</h3>
        <p><strong>👤 Имя:</strong> ${data.name}</p>
        <p><strong>📞 Телефон:</strong> ${data.phone}</p>
        <p><strong>📧 Email:</strong> ${data.email}</p>
        ${data.message ? `<p><strong>💬 Сообщение:</strong> ${data.message}</p>` : ''}
      </div>
      
      <p style="color: #64748b; font-size: 14px; text-align: center;">
        Это автоматическое уведомление, пожалуйста, не отвечайте на это письмо.<br>
        Если у вас есть вопросы, свяжитесь с нами по телефону.
      </p>
    </div>
  `

  try {
    console.log("🔍 [EMAIL] Sending confirmation to:", data.email)
    
    const response = await fetch(`${getBaseUrl()}/api/notifications/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.email,
        subject: "Подтверждение получения заявки",
        html: emailHtml
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    console.log("✅ [EMAIL] Confirmation sent successfully")
  } catch (error) {
    console.error("❌ [EMAIL] Failed to send confirmation:", error)
  }
}

// Отправка email администратору
async function sendAdminEmail(data: LeadData, leadId: string): Promise<void> {
  const adminEmails = getAdminEmails()
  if (adminEmails.length === 0) {
    console.log("⚠️ [ADMIN_EMAIL] No admin emails configured")
    return
  }

  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">🔔 Новая заявка с сайта</h2>
      
      <div style="background: #fef2f2; padding: 15px; border-radius: 5px; border-left: 4px solid #dc2626;">
        <p><strong>📋 ID заявки:</strong> ${leadId}</p>
        <p><strong>👤 Имя:</strong> ${data.name}</p>
        <p><strong>📞 Телефон:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
        <p><strong>📧 Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p><strong>💬 Сообщение:</strong> ${data.message}</p>
        <p><strong>🌐 Источник:</strong> website_footer</p>
        <p><strong>⏰ Время:</strong> ${new Date().toLocaleString('ru-RU')}</p>
      </div>
      
      <p style="margin-top: 20px;">
        <a href="${getBaseUrl()}/admin/leads/${leadId}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Посмотреть в админке
        </a>
      </p>
    </div>
  `

  for (const email of adminEmails) {
    try {
      console.log("🔍 [ADMIN_EMAIL] Sending to admin:", email)
      
      const response = await fetch(`${getBaseUrl()}/api/notifications/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `📥 Новая заявка: ${data.name}`,
          html: adminEmailHtml
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      console.log("✅ [ADMIN_EMAIL] Sent to admin successfully:", email)
    } catch (error) {
      console.error("❌ [ADMIN_EMAIL] Failed to send to admin:", email, error)
    }
  }
}

// Отправка Telegram уведомления
async function sendTelegramNotification(data: LeadData, leadId: string): Promise<void> {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatIds = process.env.TELEGRAM_CHAT_IDS?.split(",").map(id => id.trim()).filter(id => id) || []

  if (!telegramToken) {
    console.log("⚠️ [TELEGRAM] TELEGRAM_BOT_TOKEN not set")
    return
  }

  if (telegramChatIds.length === 0) {
    console.log("⚠️ [TELEGRAM] TELEGRAM_CHAT_IDS not set")
    return
  }

  const telegramMessage = `🔔 *Новая заявка с сайта*

📋 *ID:* ${leadId}
👤 *Имя:* ${data.name}
📞 *Телефон:* \`${data.phone}\`
📧 *Email:* ${data.email}
💬 *Сообщение:* ${data.message || 'Не указано'}

🌐 *Источник:* website_footer
⏰ *Время:* ${new Date().toLocaleString('ru-RU')}`

  for (const chatId of telegramChatIds) {
    try {
      console.log("🔍 [TELEGRAM] Sending to chat:", chatId)
      
      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramMessage,
          parse_mode: "Markdown"
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error("❌ [TELEGRAM] API error:", result)
      } else {
        console.log("✅ [TELEGRAM] Notification sent to:", chatId)
      }
    } catch (error) {
      console.error("❌ [TELEGRAM] Failed to send to chat:", chatId, error)
    }
  }
}

// Вспомогательные функции
function getAdminEmails(): string[] {
  const adminEmail = process.env.ADMIN_EMAIL
  
  if (!adminEmail) {
    return []
  }
  
  return adminEmail
    .split(',')
    .map(email => email.trim())
    .filter(email => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      if (!isValid) {
        console.warn("⚠️ [CONFIG] Invalid admin email:", email)
      }
      return isValid
    })
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  return 'http://localhost:3000'
}
