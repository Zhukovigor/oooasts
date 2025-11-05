import nodemailer from "nodemailer"

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

// Кэширование конфигурации (на 5 минут)
let cachedConfig: EmailConfig | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

export async function getEmailConfig(): Promise<EmailConfig | null> {
  // Проверяем кэш
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig
  }

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .single()

    if (error || !data?.email_enabled || !data?.email_host || !data?.email_from) {
      console.log("[Email] Email not configured or disabled")
      cachedConfig = null
      return null
    }

    const config: EmailConfig = {
      host: data.email_host,
      port: data.email_port || 587,
      secure: data.email_secure ?? true,
      auth: {
        user: data.email_user,
        pass: data.email_password,
      },
      from: data.email_from,
    }

    cachedConfig = config
    cacheTimestamp = Date.now()
    
    return config
  } catch (error) {
    console.error("[Email] Error getting email config:", error)
    return null
  }
}

export async function sendEmail(
  to: string | string[], 
  subject: string, 
  html: string, 
  text?: string
): Promise<boolean> {
  try {
    const config = await getEmailConfig()
    if (!config) {
      console.log("[Email] Email configuration not available")
      return false
    }

    const transporter = nodemailer.createTransport(config)

    // Валидация email перед отправкой
    const recipients = Array.isArray(to) ? to : [to]
    const validEmails = recipients.filter(email => 
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )

    if (validEmails.length === 0) {
      console.error("[Email] No valid email addresses provided")
      return false
    }

    const result = await transporter.sendMail({
      from: config.from,
      to: validEmails.join(', '),
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Автоматическое создание text-версии
    })

    console.log("[Email] Email sent successfully:", result.messageId)
    
    // Логируем отправку в БД для аналитики
    await logEmailNotification(validEmails, subject, true)
    
    return true
  } catch (error) {
    console.error("[Email] Error sending email:", error)
    
    // Логируем ошибку
    const recipients = Array.isArray(to) ? to : [to]
    await logEmailNotification(recipients, subject, false, error instanceof Error ? error.message : 'Unknown error')
    
    return false
  }
}

// Шаблоны email для рекламного кабинета
export const emailTemplates = {
  // Уведомление о низком балансе
  lowBalance: (advertiserName: string, campaignName: string, balance: number): EmailTemplate => ({
    subject: `Низкий баланс кампании: ${campaignName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b35;">Внимание: Низкий баланс</h2>
        <p>Уважаемый(ая) ${advertiserName},</p>
        <p>Баланс вашей кампании <strong>"${campaignName}"</strong> составляет <strong>${balance} руб.</strong></p>
        <p>Для непрерывного показа рекламы пополните баланс.</p>
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing" 
             style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Пополнить баланс
          </a>
        </div>
      </div>
    `
  }),

  // Уведомление о завершении модерации
  moderationResult: (advertiserName: string, bannerName: string, approved: boolean, reason?: string): EmailTemplate => ({
    subject: `Результат модерации баннера: ${bannerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${approved ? '#28a745' : '#dc3545'};">Результат модерации</h2>
        <p>Уважаемый(ая) ${advertiserName},</p>
        <p>Ваш баннер <strong>"${bannerName}"</strong> был <strong>${approved ? 'одобрен' : 'отклонен'}</strong>.</p>
        ${!approved && reason ? `<p><strong>Причина:</strong> ${reason}</p>` : ''}
        ${approved ? `
          <p>Баннер теперь активен и будет показываться в соответствии с настройками кампании.</p>
        ` : `
          <p>Пожалуйста, исправьте замечания и загрузите баннер снова.</p>
        `}
      </div>
    `
  }),

  // Уведомление о завершении кампании
  campaignEnded: (advertiserName: string, campaignName: string, stats: any): EmailTemplate => ({
    subject: `Кампания завершена: ${campaignName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Кампания завершена</h2>
        <p>Уважаемый(ая) ${advertiserName},</p>
        <p>Ваша кампания <strong>"${campaignName}"</strong> завершена.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Итоговая статистика:</h3>
          <p>Показы: <strong>${stats.impressions?.toLocaleString()}</strong></p>
          <p>Клики: <strong>${stats.clicks?.toLocaleString()}</strong></p>
          <p>CTR: <strong>${stats.ctr}%</strong></p>
          <p>Расход: <strong>${stats.spent} руб.</strong></p>
        </div>
      </div>
    `
  })
}

// Функция для логирования отправки email
async function logEmailNotification(
  recipients: string[], 
  subject: string, 
  success: boolean, 
  error?: string
): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    await supabase.from("email_logs").insert({
      recipients,
      subject,
      success,
      error_message: error,
      sent_at: new Date().toISOString()
    })
  } catch (logError) {
    console.error("[Email] Error logging email notification:", logError)
  }
}

// Функция для проверки конфигурации email
export async function testEmailConfig(): Promise<boolean> {
  try {
    const config = await getEmailConfig()
    if (!config) return false

    const transporter = nodemailer.createTransport(config)
    await transporter.verify()
    return true
  } catch (error) {
    console.error("[Email] Email configuration test failed:", error)
    return false
  }
}
