import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// VK ID App credentials
const VK_APP_ID = process.env.VK_APP_ID || '54519669'
const VK_APP_SECRET = process.env.VK_APP_SECRET
const REDIRECT_URI = 'https://asts.vercel.app/api/vk/callback'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const deviceId = searchParams.get('device_id')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle errors from VK
  if (error) {
    console.error('VK Auth Error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/vk-auth?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  // If no code, redirect to auth page
  if (!code) {
    return NextResponse.redirect(new URL('/vk-auth', request.url))
  }

  try {
    // Exchange code for access token
    if (!VK_APP_SECRET) {
      console.error('VK_APP_SECRET not configured')
      return NextResponse.redirect(
        new URL('/vk-auth?error=Server+configuration+error', request.url)
      )
    }

    const tokenResponse = await fetch('https://id.vk.com/oauth2/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: VK_APP_ID,
        client_secret: VK_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        device_id: deviceId || '',
        state: state || '',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('VK Token Error:', tokenData)
      return NextResponse.redirect(
        new URL(`/vk-auth?error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`, request.url)
      )
    }

    // Success - redirect with token info (in production, store this securely)
    const successUrl = new URL('/vk-auth', request.url)
    successUrl.searchParams.set('success', 'true')
    if (tokenData.access_token) {
      // In production, store token in session/database instead of URL
      successUrl.searchParams.set('user_id', tokenData.user_id?.toString() || '')
    }
    
    return NextResponse.redirect(successUrl)

  } catch (err) {
    console.error('VK Callback Error:', err)
    return NextResponse.redirect(
      new URL('/vk-auth?error=Internal+server+error', request.url)
    )
  }
}

// Handle POST requests (for VKID SDK callback mode)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, device_id, state } = body

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    if (!VK_APP_SECRET) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://id.vk.com/oauth2/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: VK_APP_ID,
        client_secret: VK_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        device_id: device_id || '',
        state: state || '',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error_description || tokenData.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user_id: tokenData.user_id,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    })

  } catch (err) {
    console.error('VK Callback POST Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
