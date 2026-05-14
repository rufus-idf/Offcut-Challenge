export const metadata = { title: 'Edit listing' }

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { FINISHES_BY_CATEGORY, type Category } from '@/lib/constants'
import { formatDimensions } from '@/lib/format'
import { updateListing } from './actions'
import { SubmitButton } from '@/components/submit-button'
import { DiscountFields } from '@/components/discount-fields'

const inputClass = 'rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20'

export default async function EditListingPage({
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

  const [{ data: listing }, { data: profile }] = await Promise.all([
    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('profiles')
      .select('workshop_id, workshops(name)')
      .eq('id', user.id)
      .single(),
  ])

  if (!listing || listing.status !== 'active') notFound()
  if (!profile?.workshop_id) redirect('/onboarding')

  // Only the owning workshop can edit
  if (listing.workshop_id !== profile.workshop_id) notFound()

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const action = updateListing.bind(null, id)

  const category = (listing.category as Category) in FINISHES_BY_CATEGORY
    ? listing.category as Category
    : 'Wood'
  const finishes = FINISHES_BY_CATEGORY[category]

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-2xl px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Edit listing</h1>
          <p className="mt-2 text-sm text-stone-500">
            Update price, quantity, finish, or description. Dimensions and material are fixed once published.
          </p>
        </div>

        {/* Fixed details — read-only summary */}
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5">
          <p className="font-semibold text-stone-900">{listing.material}</p>
          <p className="text-sm text-stone-500">{listing.category}</p>
          {listing.length_mm && listing.width_mm && (
            <p className="mt-1 text-sm text-stone-600">
              {formatDimensions(listing.length_mm, listing.width_mm, listing.thickness_mm)}
            </p>
          )}
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <form action={action} className="flex flex-col gap-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="finish" className="text-sm font-medium text-stone-700">Finish</label>
            <select id="finish" name="finish" required defaultValue={listing.finish ?? ''} className={inputClass}>
              <option value="">Select…</option>
              {finishes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="price" className="text-sm font-medium text-stone-700">Asking price (£)</label>
            <input
              id="price" name="price" type="number" required min="0.01" step="0.01"
              defaultValue={(listing.price_pence / 100).toFixed(2)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="quantity" className="text-sm font-medium text-stone-700">Quantity available</label>
            <input
              id="quantity" name="quantity" type="number" required min="1"
              defaultValue={listing.quantity}
              className={`${inputClass} w-32`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-stone-700">
              Description <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <textarea
              id="description" name="description" rows={3}
              defaultValue={listing.description ?? ''}
              className={`${inputClass} resize-none`}
            />
          </div>

          <DiscountFields
            initialMinQty={listing.discount_min_qty}
            initialPct={listing.discount_pct}
          />

          <div className="flex gap-3 pt-2">
            <SubmitButton
              pendingText="Saving…"
              className="rounded-lg bg-[#3DBE72] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-[#2A9E5A] disabled:opacity-60"
            >
              Save changes
            </SubmitButton>
            <a
              href={`/listings/${id}`}
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
