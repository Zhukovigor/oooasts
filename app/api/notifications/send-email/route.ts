import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Хранилище для ограничения запросов (в продакшене использовать Redis)
const ограничительЗапросов = new Map()

// Интерфейс для валидации
interface EmailЗапрос {
  to: string
  subject: string
  html: string
  adminEmail?: string
}

export async function POST(запрос: NextRequest) {
  const ipКлиента = запрос.ip || запрос.headers.get('x-forwarded-for') || 'неизвестно'
  
  // Проверка ограничения запросов
  if (превышенЛимитЗапросов(ipКлиента)) {
    return NextResponse.json(
      { error: "Слишком много запросов. Пожалуйста, попробуйте позже." },
      { status: 429 }
    )
  }

  try {
    const тело: EmailЗапрос = await запрос.json()

    // Валидация обязательных полей
    const ошибкаВалидации = валидироватьEmailЗапрос(тело)
    if (ошибкаВалидации) {
      return NextResponse.json(
        { error: ошибкаВалидации },
        { status: 400 }
      )
    }

    const { to, subject, html, adminEmail } = тело

    const supabase = createAdminClient()

    // Получение SMTP конфигурации
    const { data: smtpАккаунт, error: ошибкаSmtp } = await supabase
      .from("smtp_accounts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (ошибкаSmtp || !smtpАккаунт) {
      console.error("[Email API] Ошибка конфигурации SMTP:", ошибкаSmtp?.message)
      return NextResponse.json(
        { error: "Сервис email временно недоступен" },
        { status: 503 }
      )
    }

    // Валидация SMTP конфигурации
    const ошибкаКонфигурации = валидироватьSmtpКонфигурацию(smtpАккаунт)
    if (ошибкаКонфигурации) {
      console.error("[Email API] Неверная конфигурация SMTP:", ошибкаКонфигурации)
      return NextResponse.json(
        { error: "Ошибка конфигурации email сервиса" },
        { status: 500 }
      )
    }

    // Создание транспортера с улучшенной конфигурацией
    const транспортер = nodemailer.createTransport({
      host: smtpАккаунт.smtp_host,
      port: smtpАккаунт.smtp_port,
      secure: smtpАккаунт.smtp_port === 465, // или 587 для STARTTLS
      auth: {
        user: smtpАккаунт.smtp_user,
        pass: smtpАккаунт.smtp_password,
      },
      connectionTimeout: 10000, // 10 секунд
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    // Проверка конфигурации транспортера
    try {
      await транспортер.verify()
    } catch (ошибкаПроверки) {
      console.error("[Email API] Ошибка подключения SMTP:", ошибкаПроверки)
      return NextResponse.json(
        { error: "Не удалось подключиться к email сервису" },
        { status: 502 }
      )
    }

    // Подготовка и отправка email пользователю
    const опцииEmailПользователя = {
      from: форматироватьАдресОтправителя(smtpАккаунт.name, smtpАккаунт.email),
      to: to,
      subject: subject.trim(),
      html: html,
      replyTo: smtpАккаунт.email,
      headers: {
        'X-Mailer': 'Next.js Email API',
        'X-Application': 'Ваше-Название-Приложения'
      }
    }

    console.log("[Email API] Отправка email пользователю:", to)
    const результатПользователя = await транспортер.sendMail(опцииEmailПользователя)
    console.log("[Email API] Email пользователю отправлен:", результатПользователя.messageId)

    // Отправка уведомления администратору если нужно
    let результатАдмина = null
    if (adminEmail && adminEmail !== to && валидныйEmail(adminEmail)) {
      const опцииEmailАдмина = {
        ...опцииEmailПользователя,
        to: adminEmail,
        subject: `[НОВАЯ ЗАЯВКА] ${subject.trim()}`,
      }

      console.log("[Email API] Отправка уведомления администратору:", adminEmail)
      результатАдмина = await транспортер.sendMail(опцииEmailАдмина)
      console.log("[Email API] Email администратору отправлен:", результатАдмина.messageId)
    }

    // Логирование отправки email для аналитики
    await залогироватьEmailСобытие(supabase, {
      получатель: to,
      тема: subject,
      email_админа: adminEmail,
      id_сообщения_пользователя: результатПользователя.messageId,
      id_сообщения_админа: результатАдмина?.messageId,
      id_smtp_аккаунта: smtpАккаунт.id,
      статус: 'отправлено'
    })

    return NextResponse.json({ 
      success: true,
      messageId: результатПользователя.messageId,
      adminMessageId: результатАдмина?.messageId 
    })

  } catch (ошибка) {
    console.error("[Email API] Неожиданная ошибка:", ошибка)
    
    // Логирование ошибки
    await залогироватьEmailСобытие(supabase, {
      получатель: тело?.to || 'неизвестно',
      тема: тело?.subject || 'неизвестно',
      email_админа: тело?.adminEmail,
      статус: 'ошибка',
      ошибка: ошибка instanceof Error ? ошибка.message : 'Неизвестная ошибка'
    }).catch(console.error)

    return NextResponse.json(
      { 
        error: "Внутренняя ошибка сервера",
        ...(process.env.NODE_ENV === 'development' && {
          details: ошибка instanceof Error ? ошибка.message : "Неизвестная ошибка"
        })
      },
      { status: 500 }
    )
  }
}

// Вспомогательные функции
function валидироватьEmailЗапрос(тело: any): string | null {
  if (!тело.to || !тело.subject || !тело.html) {
    return "Отсутствуют обязательные поля: to, subject, html"
  }

  if (!валидныйEmail(тело.to)) {
    return "Неверный email адрес получателя"
  }

  if (тело.adminEmail && !валидныйEmail(тело.adminEmail)) {
    return "Неверный email адрес администратора"
  }

  if (тело.subject.length > 200) {
    return "Слишком длинная тема (максимум 200 символов)"
  }

  return null
}

function валидныйEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function валидироватьSmtpКонфигурацию(smtpАккаунт: any): string | null {
  if (!smtpАккаунт.smtp_host || !smtpАккаунт.smtp_port || 
      !smtpАккаунт.smtp_user || !smtpАккаунт.smtp_password) {
    return "Неполная SMTP конфигурация"
  }

  if (typeof smtpАккаунт.smtp_port !== 'number' || smtpАккаунт.smtp_port <= 0) {
    return "Неверный SMTP порт"
  }

  return null
}

function форматироватьАдресОтправителя(имя: string, email: string): string {
  return имя ? `${имя} <${email}>` : email
}

function превышенЛимитЗапросов(идентификатор: string): boolean {
  const сейчас = Date.now()
  const окноВремени = 15 * 60 * 1000 // 15 минут
  const максЗапросов = 10 // максимум 10 запросов за окно
  
  const запросы = ограничительЗапросов.get(идентификатор) || []
  const недавниеЗапросы = запросы.filter((время: number) => сейчас - время < окноВремени)
  
  if (недавниеЗапросы.length >= максЗапросов) {
    return true
  }
  
  недавниеЗапросы.push(сейчас)
  ограничительЗапросов.set(идентификатор, недавниеЗапросы)
  
  // Периодическая очистка старых записей
  if (Math.random() < 0.1) { // 10% шанс на очистку
    for (const [ключ, времена] of ограничительЗапросов.entries()) {
      const валидныеВремена = (времена as number[]).filter((время: number) => сейчас - время < окноВремени)
      if (валидныеВремена.length === 0) {
        ограничительЗапросов.delete(ключ)
      } else {
        ограничительЗапросов.set(ключ, валидныеВремена)
      }
    }
  }
  
  return false
}

async function залогироватьEmailСобытие(
  supabase: any, 
  событие: {
    получатель: string
    тема: string
    email_админа?: string
    id_сообщения_пользователя?: string
    id_сообщения_админа?: string
    id_smtp_аккаунта: string
    статус: 'отправлено' | 'ошибка'
    ошибка?: string
  }
) {
  try {
    await supabase
      .from("email_logs")
      .insert({
        to: событие.получатель,
        subject: событие.тема,
        admin_email: событие.email_админа,
        user_message_id: событие.id_сообщения_пользователя,
        admin_message_id: событие.id_сообщения_админа,
        smtp_account_id: событие.id_smtp_аккаунта,
        status: событие.статус,
        error: событие.ошибка,
        created_at: new Date().toISOString()
      })
  } catch (ошибка) {
    console.error("[Email API] Не удалось записать событие email:", ошибка)
  }
}
