import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatDimensions } from '@/lib/format'
import { reduceQuantity } from './actions'
import { SubmitButton } from '@/components/submit-button'

const inputClass = 'rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'

export default async function ReduceQtyPage({
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
    .select('*, listings(id)')
    .eq('id', id)
    .eq('status', 'listed')
    .single()

  if (!item) notFound()

  const listings = Array.isArray(item.listings) ? item.listings : item.listings ? [item.listings] : []
  const listing = listings[0]
  if (!listing) notFound()

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const action = reduceQuantity.bind(null, id, listing.id)

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-sm px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Record a sale</h1>
          <p className="mt-2 text-sm text-stone-500">
            How many units did you sell? The listing stays active with the remaining quantity.
            If you sold all of them, the listing closes automatically.
          </p>
        </div>

        {/* Item summary */}
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5">
          <p className="font-semibold text-stone-900">{item.material}</p>
          <p className="text-sm text-stone-500">{item.finish} · {item.category}</p>
          {item.length_mm && item.width_mm && (
            <p className="mt-1 text-sm text-stone-600">
              {formatDimensions(item.length_mm, item.width_mm, item.thickness_mm ?? 0)}
            </p>
          )}
          <p className="mt-2 text-sm font-medium text-stone-700">
            Current quantity: <span className="text-amber-700">{item.quantity}</span>
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <form action={action} className="flex flex-col gap-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sold_qty" className="text-sm font-medium text-stone-700">
              Units sold
            </label>
            <input
              id="sold_qty" name="sold_qty" type="number"
              required min="1" max={item.quantity}
              defaultValue="1"
              className={`${inputClass} w-28`}
            />
            <p className="text-xs text-stone-400">
              Max {item.quantity} · selling all {item.quantity} will close the listing
            </p>
          </div>

          <div className="flex gap-3 pt-1">
            <SubmitButton
              pendingText="Saving…"
              className="rounded-lg bg-amber-700 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
            >
              Save
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
