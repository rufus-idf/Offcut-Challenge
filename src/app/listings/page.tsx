import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatPrice, formatDimensions } from '@/lib/format'
import type { ListingWithWorkshop } from '@/lib/types'

export default async function BrowsePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const { data: listings } = await supabase
    .from('listings')
    .select('*, workshops(name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Browse listings</h1>
            <p className="mt-1 text-sm text-stone-500">
              {listings?.length ?? 0} active listing{listings?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/listings/new"
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
          >
            + New listing
          </Link>
        </div>

        {!listings?.length ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white py-20 text-center">
            <p className="text-stone-500">No listings yet. Be the first to post one.</p>
            <Link
              href="/listings/new"
              className="mt-4 inline-block rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
            >
              Post a listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(listings as ListingWithWorkshop[]).map(listing => (
              <div
                key={listing.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-stone-900">{listing.material}</p>
                    <p className="text-sm text-stone-500">{listing.finish}</p>
                  </div>
                  <p className="text-lg font-bold text-amber-700">{formatPrice(listing.price_pence)}</p>
                </div>

                <p className="mb-1 text-sm text-stone-700">
                  {formatDimensions(listing.length_mm, listing.width_mm, listing.thickness_mm)}
                </p>
                <p className="mb-3 text-sm text-stone-500">
                  Qty: {listing.quantity}
                </p>

                {listing.description && (
                  <p className="mb-3 text-sm text-stone-600 line-clamp-2">{listing.description}</p>
                )}

                <p className="text-xs text-stone-400">{listing.workshops.name}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
