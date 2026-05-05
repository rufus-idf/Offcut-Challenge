import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { MATERIALS, FINISHES } from '@/lib/constants'
import { createListing } from './actions'

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const { error } = await searchParams
  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name

  const inputClass =
    'rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-8 text-2xl font-bold text-stone-900">New listing</h1>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <form action={createListing} className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="grid gap-6">

            {/* Material & finish */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="material" className="text-sm font-medium text-stone-700">Material</label>
                <select id="material" name="material" required className={inputClass}>
                  <option value="">Select…</option>
                  {MATERIALS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="finish" className="text-sm font-medium text-stone-700">Finish</label>
                <select id="finish" name="finish" required className={inputClass}>
                  <option value="">Select…</option>
                  {FINISHES.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700">Dimensions (mm)</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="length_mm" className="text-xs text-stone-500">Length</label>
                  <input
                    id="length_mm" name="length_mm" type="number" required min="1"
                    placeholder="e.g. 1200"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="width_mm" className="text-xs text-stone-500">Width</label>
                  <input
                    id="width_mm" name="width_mm" type="number" required min="1"
                    placeholder="e.g. 600"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="thickness_mm" className="text-xs text-stone-500">Thickness</label>
                  <input
                    id="thickness_mm" name="thickness_mm" type="number" required min="1"
                    placeholder="e.g. 18"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Quantity & price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="quantity" className="text-sm font-medium text-stone-700">Quantity</label>
                <input
                  id="quantity" name="quantity" type="number" required min="1" defaultValue="1"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="price" className="text-sm font-medium text-stone-700">Price (£)</label>
                <input
                  id="price" name="price" type="number" required min="0.01" step="0.01"
                  placeholder="e.g. 12.50"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-stone-700">
                Description <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <textarea
                id="description" name="description" rows={3}
                placeholder="Any useful details — condition, grain direction, why it's leftover, etc."
                className={`${inputClass} resize-none`}
              />
            </div>

          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-amber-700 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-amber-800"
            >
              Post listing
            </button>
            <a
              href="/dashboard"
              className="rounded-lg border border-stone-300 px-6 py-2.5 font-semibold text-stone-700 transition-colors hover:bg-stone-50"
            >
              Cancel
            </a>
          </div>
        </form>
      </main>
    </div>
  )
}
