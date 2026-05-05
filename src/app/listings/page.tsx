import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatPrice, formatDimensions, getImageUrl } from '@/lib/format'
import { MATERIALS, FINISHES } from '@/lib/constants'
import type { ListingWithWorkshop } from '@/lib/types'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ material?: string; finish?: string; max_price?: string }>
}) {
  const filters = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  let query = supabase
    .from('listings')
    .select('*, workshops(name), listing_images(storage_path, position)')
    .eq('status', 'active')

  if (filters.material) query = query.eq('material', filters.material)
  if (filters.finish)   query = query.eq('finish', filters.finish)
  if (filters.max_price) {
    query = query.lte('price_pence', Math.round(parseFloat(filters.max_price) * 100))
  }

  const { data: listings } = await query.order('created_at', { ascending: false })

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const hasFilters = !!(filters.material || filters.finish || filters.max_price)

  const selectClass = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900">Browse listings</h1>
          <Link
            href="/listings/new"
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
          >
            + New listing
          </Link>
        </div>

        {/* Filters */}
        <form method="get" className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Material</label>
            <select name="material" defaultValue={filters.material ?? ''} className={selectClass}>
              <option value="">All materials</option>
              {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Finish</label>
            <select name="finish" defaultValue={filters.finish ?? ''} className={selectClass}>
              <option value="">All finishes</option>
              {FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-500">Max price (£)</label>
            <input
              type="number"
              name="max_price"
              min="0"
              step="0.01"
              defaultValue={filters.max_price ?? ''}
              placeholder="Any"
              className={`${selectClass} w-28`}
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
          >
            Filter
          </button>

          {hasFilters && (
            <Link href="/listings" className="text-sm text-stone-500 hover:text-stone-700">
              Clear filters
            </Link>
          )}
        </form>

        <p className="mb-4 text-sm text-stone-500">
          {listings?.length ?? 0} listing{listings?.length !== 1 ? 's' : ''}
          {hasFilters ? ' matching your filters' : ''}
        </p>

        {!listings?.length ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white py-20 text-center">
            <p className="text-stone-500">
              {hasFilters ? 'No listings match those filters.' : 'No listings yet. Be the first to post one.'}
            </p>
            {!hasFilters && (
              <Link href="/listings/new" className="mt-4 inline-block rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
                Post a listing
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(listings as ListingWithWorkshop[]).map(listing => {
              const firstImage = [...listing.listing_images]
                .sort((a, b) => a.position - b.position)[0]

              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image or placeholder */}
                  <div className="relative aspect-[4/3] bg-stone-100">
                    {firstImage ? (
                      <Image
                        src={getImageUrl(firstImage.storage_path)}
                        alt={`${listing.material} ${listing.finish}`}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-sm text-stone-400">{listing.material}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-stone-900">{listing.material}</p>
                        <p className="text-sm text-stone-500">{listing.finish}</p>
                      </div>
                      <p className="font-bold text-amber-700">{formatPrice(listing.price_pence)}</p>
                    </div>
                    <p className="text-sm text-stone-600">
                      {formatDimensions(listing.length_mm, listing.width_mm, listing.thickness_mm)}
                    </p>
                    <p className="mt-0.5 text-sm text-stone-400">Qty: {listing.quantity}</p>
                    <p className="mt-3 text-xs text-stone-400">{listing.workshops.name}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
