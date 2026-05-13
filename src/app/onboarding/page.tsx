export const metadata = { title: 'Set up your workshop' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createWorkshop } from './actions'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // If they already have a workshop, skip onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (profile?.workshop_id) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-stone-900">Set up your workshop</h1>
          <p className="mt-2 text-sm text-stone-500">
            This is the name buyers will see on your listings.
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <form action={createWorkshop} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-stone-700">
                Workshop name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Timber & Co, Bristol"
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-lg bg-[#3DBE72] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#2A9E5A]"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
