import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// VK ID App credentials
const VK_APP_ID = process.env.VK_APP_ID || process.env.NEXT_PUBLIC_VK_APP_ID || '54519669'
const VK_APP_SECRET = process.env.VK_APP_SECRET
const VK_REDIRECT_URI =
  process.env.VK_REDIRECT_URI ||
  process.env.NEXT_PUBLIC_VK_REDIRECT_URI ||
  'https://asts.vercel.app/api/vk/callback'

async function exchangeCodeForToken(params: {
  code: string
  deviceId?: string
  state?: string
}) {
  if (!VK_APP_SECRET) {
    throw new Error('VK_APP_SECRET not configured')
  }

  const tokenResponse = await fetch('https://id.vk.com/oauth2/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      client_id: VK_APP_ID,
      client_secret: VK_APP_SECRET,
      redirect_uri: VK_REDIRECT_URI,
      device_id: params.deviceId || '',
      state: params.state || '',
    }),
  })

  const rawResponse = await tokenResponse.text()
  let tokenData: Record<string, any> = {}

  try {
    tokenData = rawResponse ? JSON.parse(rawResponse) : {}
  } catch {
    tokenData = { error: rawResponse || 'Invalid VK response' }
  }

  if (!tokenResponse.ok || tokenData.error) {
    const errorMessage = tokenData.error_description || tokenData.error || 'VK token exchange failed'
    throw new Error(errorMessage)
  }

  return tokenData
}

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
    const tokenData = await exchangeCodeForToken({
      code,
      deviceId: deviceId || undefined,
      state: state || undefined,
    })

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
      new URL(`/vk-auth?error=${encodeURIComponent(err instanceof Error ? err.message : 'Internal server error')}`, request.url)
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

    const tokenData = await exchangeCodeForToken({
      code,
      deviceId: device_id || undefined,
      state: state || undefined,
    })

    return NextResponse.json({
      success: true,
      user_id: tokenData.user_id,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    })

  } catch (err) {
    console.error('VK Callback POST Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
