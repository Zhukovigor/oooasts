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
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
