import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase admin client that bypasses Row Level Security (RLS).
 *
 * IMPORTANT: Only use this in server-side code (API routes, server actions, server components).
 * Never expose this client or the service role key to the client side.
 *
 * Use cases:
 * - Creating records from anonymous users (e.g., contact forms, orders)
 * - Admin operations that need to bypass RLS
 * - Background jobs and scheduled tasks
 */

// Check if admin credentials are available
export function hasAdminCredentials() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase admin credentials not available. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Safe version that returns null instead of throwing
export function createAdminClientSafe() {
  if (!hasAdminCredentials()) {
    return null
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
