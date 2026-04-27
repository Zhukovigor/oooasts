import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const VK_APP_ID = process.env.VK_APP_ID || "54519669"
const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET || ""
const VK_REDIRECT_URI = process.env.VK_REDIRECT_URI || "https://asts.vercel.app/api/vk/callback"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  // Получаем параметры от VK
  const code = searchParams.get("code")
  const deviceId = searchParams.get("device_id")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  console.log("[v0] VK callback received:", { 
    code: code ? "present" : "missing", 
    deviceId, 
    state, 
    error, 
    errorDescription 
  })

  // Если VK вернул ошибку
  if (error) {
    console.error("[v0] VK auth error:", error, errorDescription)
    return NextResponse.redirect(
      new URL(`/vk-auth?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  // Если нет кода авторизации - показываем информационную страницу
  if (!code) {
    console.log("[v0] Direct access to callback without code - showing info page")
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>VK OAuth Callback</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          h1 { color: #0077ff; }
          .info { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .config { background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 14px; }
          a { color: #0077ff; }
        </style>
      </head>
      <body>
        <h1>VK OAuth Callback Endpoint</h1>
        <div class="info">
          <p>Это callback URL для авторизации через VK. Он работает корректно.</p>
          <p>Для авторизации перейдите на <a href="/vk-auth">/vk-auth</a></p>
        </div>
        <h3>Настройки VK приложения:</h3>
        <div class="config">
          <p><strong>App ID:</strong> ${VK_APP_ID}</p>
          <p><strong>Redirect URI:</strong> ${VK_REDIRECT_URI}</p>
          <p><strong>Client Secret:</strong> ${VK_CLIENT_SECRET ? "настроен" : "НЕ НАСТРОЕН!"}</p>
        </div>
        <h3>Инструкция по настройке VK приложения:</h3>
        <ol>
          <li>Перейдите в <a href="https://vk.com/editapp?id=${VK_APP_ID}" target="_blank">настройки VK приложения</a></li>
          <li>В разделе "Настройки" найдите "Базовый домен" и укажите: <code>asts.vercel.app</code></li>
          <li>В разделе "Авторизованные redirect URI" добавьте: <code>${VK_REDIRECT_URI}</code></li>
          <li>Сохраните изменения</li>
        </ol>
      </body>
      </html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }
    )
  }

  try {
    // Обмениваем code на access_token
    const tokenUrl = new URL("https://id.vk.com/oauth2/auth")
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      client_id: VK_APP_ID,
      redirect_uri: VK_REDIRECT_URI,
      code_verifier: "", // Для PKCE, если используется
    })

    // Если есть device_id, добавляем его
    if (deviceId) {
      tokenParams.append("device_id", deviceId)
    }

    // Если есть client_secret, добавляем его
    if (VK_CLIENT_SECRET) {
      tokenParams.append("client_secret", VK_CLIENT_SECRET)
    }

    console.log("[v0] Exchanging code for token...")

    const tokenResponse = await fetch("https://id.vk.com/oauth2/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    })

    const tokenData = await tokenResponse.json()
    console.log("[v0] Token response:", JSON.stringify(tokenData, null, 2))

    if (tokenData.error) {
      console.error("[v0] Token exchange error:", tokenData)
      return NextResponse.redirect(
        new URL(`/vk-auth?error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`, request.url)
      )
    }

    const accessToken = tokenData.access_token
    const userId = tokenData.user_id

    if (!accessToken) {
      // Попробуем альтернативный метод через oauth.vk.com
      console.log("[v0] Trying alternative token exchange via oauth.vk.com...")
      
      const altTokenResponse = await fetch(
        `https://oauth.vk.com/access_token?client_id=${VK_APP_ID}&client_secret=${VK_CLIENT_SECRET}&redirect_uri=${encodeURIComponent(VK_REDIRECT_URI)}&code=${code}`,
        { method: "GET" }
      )
      
      const altTokenData = await altTokenResponse.json()
      console.log("[v0] Alt token response:", JSON.stringify(altTokenData, null, 2))

      if (altTokenData.error) {
        return NextResponse.redirect(
          new URL(`/vk-auth?error=${encodeURIComponent(altTokenData.error_description || altTokenData.error)}`, request.url)
        )
      }

      if (altTokenData.access_token) {
        // Успешно получили токен через альтернативный метод
        return await handleSuccessfulAuth(request, altTokenData.access_token, altTokenData.user_id)
      }

      return NextResponse.redirect(
        new URL("/vk-auth?error=Не удалось получить токен доступа", request.url)
      )
    }

    return await handleSuccessfulAuth(request, accessToken, userId)

  } catch (err) {
    console.error("[v0] VK callback error:", err)
    return NextResponse.redirect(
      new URL(`/vk-auth?error=${encodeURIComponent("Ошибка авторизации: " + (err instanceof Error ? err.message : "Неизвестная ошибка"))}`, request.url)
    )
  }
}

async function handleSuccessfulAuth(request: NextRequest, accessToken: string, userId: string | number) {
  try {
    // Получаем информацию о пользователе
    const userInfoResponse = await fetch(
      `https://api.vk.com/method/users.get?user_ids=${userId}&fields=photo_200,first_name,last_name&access_token=${accessToken}&v=5.131`
    )
    
    const userInfoData = await userInfoResponse.json()
    console.log("[v0] User info:", JSON.stringify(userInfoData, null, 2))

    const user = userInfoData.response?.[0]

    // Сохраняем токен в Supabase (опционально)
    try {
      const supabase = await createClient()
      
      // Проверяем, есть ли уже такой пользователь
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("telegram", `vk_${userId}`)
        .single()

      if (!existingUser) {
        // Создаем запись о VK пользователе
        await supabase.from("site_settings").upsert({
          key: `vk_token_${userId}`,
          value: { 
            access_token: accessToken, 
            user_id: userId,
            user_name: user ? `${user.first_name} ${user.last_name}` : null,
            updated_at: new Date().toISOString()
          },
          description: `VK access token for user ${userId}`
        }, { onConflict: "key" })
      }
    } catch (dbError) {
      console.error("[v0] Database error (non-critical):", dbError)
      // Продолжаем даже если не удалось сохранить в БД
    }

    // Редирект на страницу успеха
    const successUrl = new URL("/vk-auth", request.url)
    successUrl.searchParams.set("success", "true")
    successUrl.searchParams.set("user_id", String(userId))
    if (user) {
      successUrl.searchParams.set("name", `${user.first_name} ${user.last_name}`)
    }

    return NextResponse.redirect(successUrl)

  } catch (err) {
    console.error("[v0] Error getting user info:", err)
    // Даже если не удалось получить инфо о пользователе, авторизация прошла
    const successUrl = new URL("/vk-auth", request.url)
    successUrl.searchParams.set("success", "true")
    successUrl.searchParams.set("user_id", String(userId))
    return NextResponse.redirect(successUrl)
  }
}

// POST метод для обработки callback через POST (некоторые версии VK SDK)
export async function POST(request: NextRequest) {
  const body = await request.json()
  console.log("[v0] VK callback POST:", body)

  // Перенаправляем на GET обработчик с параметрами
  const url = new URL("/api/vk/callback", request.url)
  if (body.code) url.searchParams.set("code", body.code)
  if (body.device_id) url.searchParams.set("device_id", body.device_id)
  if (body.state) url.searchParams.set("state", body.state)

  return NextResponse.redirect(url)
}
