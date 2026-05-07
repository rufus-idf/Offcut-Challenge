import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS entirely.
// Only use this server-side (API routes, Server Actions) and never expose to the browser.
// Required when the caller is not a Supabase-authenticated user (e.g. camera app API keys).
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
