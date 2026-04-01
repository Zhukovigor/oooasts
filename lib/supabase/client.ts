import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

// Check if Supabase credentials are available
export function hasSupabaseCredentials() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function createBrowserClient() {
  if (!hasSupabaseCredentials()) {
    throw new Error('Supabase credentials not available')
  }
  return createSupabaseBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Safe version that returns null instead of throwing
export function createBrowserClientSafe() {
  if (!hasSupabaseCredentials()) {
    return null
  }
  return createSupabaseBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
