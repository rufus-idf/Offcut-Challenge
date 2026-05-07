import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatDimensions } from '@/lib/format'
import { publishToMarketplace } from './actions'

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

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Publish to marketplace</h1>
          <p className="mt-2 text-sm text-stone-500">
            Set a price and this item will appear on Browse Listings for all verified workshops to see.
          </p>
        </div>

        {/* Item summary */}
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5">
          <p className="font-semibold text-stone-900">{item.material}</p>
          <p className="text-sm text-stone-500">{item.finish} · {item.category}</p>
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

        <form action={publishAction} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price" className="text-sm font-medium text-stone-700">
              Asking price (£)
            </label>
            <input
              id="price" name="price" type="number" required min="0.01" step="0.01"
              placeholder="e.g. 12.50"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-amber-700 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-amber-800"
            >
              Publish to listings
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
