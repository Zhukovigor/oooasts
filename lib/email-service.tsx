import { Resend } from "resend"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean>
export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }>
export async function sendEmail(toOrOptions: string | EmailOptions, subject?: string, html?: string) {
  let options: EmailOptions

  if (typeof toOrOptions === "string") {
    options = { to: toOrOptions, subject: subject!, html: html! }
  } else {
    options = toOrOptions
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@volgograd-asts.ru",
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (result.error) {
      console.error("[v0] Error sending email via Resend:", result.error)
      return false
    }

    console.log("[v0] Email sent successfully via Resend:", result.data?.id)
    return true
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return false
  }
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  data: Record<string, any>,
  type: "equipment" | "leasing" | "order" | "job",
) {
  const html = generateEmailTemplate(type, data)
  return sendEmail(to, subject, html)
}

function generateEmailTemplate(type: string, data: Record<string, any>): string {
  const baseStyle = `
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
  `

  let content = ""

  switch (type) {
    case "equipment":
      content = `
        <h2>Новая заявка на технику</h2>
        <p><strong>Имя:</strong> ${data.name}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Сообщение:</strong> ${data.message || "Не указано"}</p>
      `
      break

    case "leasing":
      content = `
        <h2>Новая заявка на лизинг</h2>
        <p><strong>Имя:</strong> ${data.name}</p>
        <p><strong>Компания:</strong> ${data.company}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Модель техники:</strong> ${data.equipment || "Не указано"}</p>
        <p><strong>Сообщение:</strong> ${data.message || "Не указано"}</p>
      `
      break

    case "order":
      content = `
        <h2>Новый заказ из каталога</h2>
        <p><strong>Модель:</strong> ${data.modelName}</p>
        <p><strong>Имя:</strong> ${data.name}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>Email:</strong> ${data.email || "Не указан"}</p>
        <p><strong>Комментарий:</strong> ${data.comment || "Не указан"}</p>
      `
      break

    case "job":
      content = `
        <h2>Новый отклик на вакансию</h2>
        <p><strong>Имя:</strong> ${data.name}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Город:</strong> ${data.city}</p>
        <p><strong>Возраст:</strong> ${data.age}</p>
        <p><strong>Опыт работы:</strong> ${data.experience || "Не указан"}</p>
        <p><strong>Дополнительная информация:</strong> ${data.message || "Не указано"}</p>
      `
      break
  }

  return `
    <html>
    <head>
      <meta charset="utf-8">
      <title>Новое уведомление</title>
    </head>
    <body style="${baseStyle}">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${content}
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            Это автоматическое уведомление от системы ООО АСТС. Пожалуйста, не отвечайте на это письмо.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
