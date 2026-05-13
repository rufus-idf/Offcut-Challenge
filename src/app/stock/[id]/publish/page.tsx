export const metadata = { title: 'Publish to marketplace' }

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatDimensions } from '@/lib/format'
import { FINISHES_BY_CATEGORY, type Category } from '@/lib/constants'
import { publishToMarketplace } from './actions'
import { SubmitButton } from '@/components/submit-button'

const inputClass = 'rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'

export default async function PublishPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const { data: item } = await supabase
    .from('stock_items')
    .select('*')
    .eq('id', id)
    .single()

  if (!item || item.status !== 'available') notFound()

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const publishAction = publishToMarketplace.bind(null, id)

  // Use category-specific finishes, fall back to Wood if category not recognised
  const category = (item.category as Category) in FINISHES_BY_CATEGORY
    ? item.category as Category
    : 'Wood'
  const finishes = FINISHES_BY_CATEGORY[category]

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Publish to marketplace</h1>
          <p className="mt-2 text-sm text-stone-500">
            Confirm the finish and set a price — then this item goes live on Browse Listings.
          </p>
        </div>

        {/* Item summary */}
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5">
          <p className="font-semibold text-stone-900">{item.material}</p>
          <p className="text-sm text-stone-500">{item.category}</p>
          {item.length_mm && item.width_mm && (
            <p className="mt-1 text-sm text-stone-600">
              {formatDimensions(item.length_mm, item.width_mm, item.thickness_mm)}
            </p>
          )}
          <p className="text-sm text-stone-600">Qty: {item.quantity}</p>
          {item.description && (
            <p className="mt-2 text-sm text-stone-500">{item.description}</p>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <form action={publishAction} className="flex flex-col gap-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="finish" className="text-sm font-medium text-stone-700">
              Finish
            </label>
            {/* Pre-select if the stock item already has a finish (manual entries do) */}
            <select
              id="finish" name="finish" required
              defaultValue={item.finish ?? ''}
              className={inputClass}
            >
              <option value="">Select finish…</option>
              {finishes.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="list_qty" className="text-sm font-medium text-stone-700">
              Quantity to list
            </label>
            <input
              id="list_qty" name="list_qty" type="number" required
              min="1" max={item.quantity}
              defaultValue={item.quantity}
              className={`${inputClass} w-28`}
            />
            <p className="text-xs text-stone-400">
              You have {item.quantity} in stock — list some or all of them. The rest stay private.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="price" className="text-sm font-medium text-stone-700">
              Asking price — per piece (£)
            </label>
            <input
              id="price" name="price" type="number" required min="0.01" step="0.01"
              placeholder="e.g. 12.50"
              className={inputClass}
            />
            <p className="text-xs text-stone-400">
              Buyers can purchase any quantity up to your listed amount at this price per piece.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <SubmitButton
              pendingText="Publishing…"
              className="rounded-lg bg-amber-700 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
            >
              Publish to listings
            </SubmitButton>
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
