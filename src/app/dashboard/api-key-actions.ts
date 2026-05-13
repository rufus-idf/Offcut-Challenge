'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function generateApiKey(_formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) return

  // Generate a key: oc_ prefix + UUID without hyphens
  const raw = crypto.randomUUID().replace(/-/g, '')
  const newKey = `oc_${raw}`

  // Upsert — one key per workshop, replacing any existing key
  await supabase
    .from('workshop_api_keys')
    .upsert(
      { workshop_id: profile.workshop_id, api_key: newKey },
      { onConflict: 'workshop_id' }
    )

  revalidatePath('/camera')
}
