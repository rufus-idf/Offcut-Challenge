import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatPrice, formatDimensions } from '@/lib/format'
import { markAsSold, archiveItem, relistItem } from './actions'
import { SHAPE_LABELS } from '@/components/shape-preview'
import { ShapePreviewModal } from '@/components/shape-preview-modal'
import type { StockItem } from '@/lib/types'

const STATUS_STYLES: Record<StockItem['status'], string> = {
  available: 'bg-blue-50 text-blue-700',
  listed:    'bg-green-50 text-green-700',
  sold:      'bg-stone-100 text-stone-500',
  used:      'bg-stone-100 text-stone-500',
  archived:  'bg-stone-100 text-stone-500',
}

const STATUS_LABELS: Record<StockItem['status'], string> = {
  available: 'In stock',
  listed:    'Listed',
  sold:      'Sold',
  used:      'Used',
  archived:  'Archived',
}

type WorkshopDetails = {
  id: string
  name: string
  verification_status: string
  rejection_reason: string | null
}

type ListingRef = { id: string; price_pence: number; status: string }
type StockWithListing = StockItem & { listings: ListingRef | ListingRef[] | null }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(id, name, verification_status, rejection_reason)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const workshop = profile.workshops as unknown as WorkshopDetails | null
  const { message, filter } = await searchParams
  const activeFilter = filter ?? 'all'

  let stockQuery = supabase
    .from('stock_items')
    .select('*, listings(id, price_pence, status)')
    .eq('workshop_id', profile.workshop_id)
    .order('created_at', { ascending: false })

  if (activeFilter === 'listed')    stockQuery = stockQuery.eq('status', 'listed')
  if (activeFilter === 'available') stockQuery = stockQuery.eq('status', 'available')
  if (activeFilter === 'sold')      stockQuery = stockQuery.eq('status', 'sold')
  if (activeFilter === 'archived')  stockQuery = stockQuery.eq('status', 'archived')

  const { data: rawItems } = await stockQuery

  // Normalise the listings join — Supabase returns array for has-many
  const stockItems: StockWithListing[] = (rawItems ?? []).map(item => ({
    ...item,
    listings: Array.isArray(item.listings) ? (item.listings[0] ?? null) : item.listings,
  }))

  const filterTabs = [
    { key: 'all',       label: 'All stock' },
    { key: 'available', label: 'In stock' },
    { key: 'listed',    label: 'Listed' },
    { key: 'sold',      label: 'Sold' },
    { key: 'archived',  label: 'Archived' },
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshop?.name} />

      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* Verification banners */}
        {workshop?.verification_status === 'unverified' && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Verification required.</span>{' '}
              Submit your Companies House details to start listing offcuts.
            </p>
            <Link href="/verification" className="ml-4 shrink-0 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
              Verify now
            </Link>
          </div>
        )}
        {workshop?.verification_status === 'pending' && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Application under review.</span>{' '}
              We aim to respond within 1 business day.
            </p>
          </div>
        )}
        {workshop?.verification_status === 'rejected' && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-red-800">Application not approved</p>
              {workshop.rejection_reason && (
                <p className="mt-0.5 text-sm text-red-700">{workshop.rejection_reason}</p>
              )}
            </div>
            <Link href="/verification" className="ml-4 shrink-0 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
              Resubmit
            </Link>
          </div>
        )}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <p className="text-sm text-green-800">{message}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">My Stock</h1>
            <p className="mt-1 text-sm text-stone-500">{workshop?.name}</p>
          </div>
          {workshop?.verification_status === 'approved' && (
            <Link
              href="/listings/new"
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
            >
              + Add to my stock
            </Link>
          )}
        </div>

        {/* Explainer */}
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-800">
          <span className="font-semibold">Your stock is private.</span>{' '}
          Items in your stock list are only visible to you — other workshops cannot see them.
          To make an item available to buy on the marketplace, click{' '}
          <span className="font-semibold">Publish</span> on any In Stock item and set your asking price.
        </div>

        {/* Filter tabs — always visible */}
        <div className="mb-4 flex gap-1">
          {filterTabs.map(tab => (
            <Link
              key={tab.key}
              href={tab.key === 'all' ? '/dashboard' : `/dashboard?filter=${tab.key}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === tab.key
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Stock table */}
        {!stockItems.length ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white py-20 text-center">
            <p className="mb-4 text-stone-500">
              {activeFilter !== 'all'
                ? `No ${activeFilter === 'available' ? 'in-stock' : activeFilter} items.`
                : workshop?.verification_status === 'approved'
                  ? 'No stock yet.'
                  : 'Complete verification to start adding stock.'}
            </p>
            {workshop?.verification_status === 'approved' && activeFilter === 'all' && (
              <Link href="/listings/new" className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
                Add your first item
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs font-medium uppercase tracking-wide text-stone-400">
                  <th className="px-5 py-3">Shape</th>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3">Dimensions</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stockItems.map(item => {
                  const listing = item.listings as ListingRef | null
                  return (
                    <tr key={item.id} className="hover:bg-stone-50">
                      <td className="px-3 py-2">
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-12 w-16">
                          <ShapePreviewModal
                            shapeType={item.shape_type}
                            verticesMm={item.vertices_mm}
                            lengthMm={item.length_mm}
                            widthMm={item.width_mm}
                            thicknessMm={item.thickness_mm}
                            bboxWMm={item.bbox_w_mm}
                            bboxHMm={item.bbox_h_mm}
                          />
                        </div>
                        <span className="text-xs text-stone-400">
                          {SHAPE_LABELS[item.shape_type] ?? item.shape_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                        {listing ? (
                          <Link href={`/listings/${listing.id}`} className="hover:underline">
                            <p className="font-medium text-stone-900">{item.material}</p>
                            <p className="text-stone-400">{item.finish}</p>
                          </Link>
                        ) : (
                          <>
                            <p className="font-medium text-stone-900">{item.material}</p>
                            <p className="text-stone-400">{item.finish}</p>
                          </>
                        )}
                        <p className="text-xs text-stone-400">{item.category}</p>
                      </td>
                      <td className="px-5 py-3 text-stone-600">
                        {item.length_mm && item.width_mm
                          ? formatDimensions(item.length_mm, item.width_mm, item.thickness_mm)
                          : `${item.bbox_w_mm ?? '?'} × ${item.bbox_h_mm ?? '?'} × ${item.thickness_mm}mm`}
                      </td>
                      <td className="px-5 py-3 text-stone-600">{item.quantity}</td>
                      <td className="px-5 py-3 font-medium text-stone-900">
                        {listing ? formatPrice(listing.price_pence) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {item.status === 'available' && (
                            <>
                              <Link
                                href={`/stock/${item.id}/publish`}
                                className="text-xs font-medium text-amber-700 hover:text-amber-900"
                              >
                                Publish
                              </Link>
                              <Link
                                href={`/stock/${item.id}/edit`}
                                className="text-xs text-stone-500 hover:text-stone-700"
                              >
                                Edit
                              </Link>
                            </>
                          )}
                          {listing && item.status === 'listed' && (
                            <>
                              <Link href={`/listings/${listing.id}`} className="text-xs text-stone-500 hover:text-stone-700">
                                View
                              </Link>
                              <Link href={`/listings/${listing.id}/edit`} className="text-xs text-stone-500 hover:text-stone-700">
                                Edit
                              </Link>
                              <Link href={`/stock/${item.id}/reduce-qty`} className="text-xs text-stone-500 hover:text-stone-700">
                                Sold some
                              </Link>
                              <form action={markAsSold.bind(null, item.id, listing.id)}>
                                <button type="submit" className="text-xs text-amber-700 hover:text-amber-900">
                                  Mark sold
                                </button>
                              </form>
                              <form action={archiveItem.bind(null, item.id, listing.id)}>
                                <button type="submit" className="text-xs text-stone-400 hover:text-stone-600">
                                  Archive
                                </button>
                              </form>
                            </>
                          )}
                          {listing && (item.status === 'sold' || item.status === 'archived') && (
                            <form action={relistItem.bind(null, item.id, listing.id)}>
                              <button type="submit" className="text-xs text-green-700 hover:text-green-900">
                                Relist
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Camera app upgrade banner */}
        {workshop?.verification_status === 'approved' && (
          <Link
            href="/camera"
            className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 transition-colors hover:bg-amber-100"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">📷</span>
              <div>
                <p className="font-semibold text-amber-900">Camera App Integration</p>
                <p className="text-sm text-amber-700">
                  Automatically scan and catalogue offcuts directly into your stock — no manual entry needed.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white">
              Learn more →
            </span>
          </Link>
        )}
      </main>
    </div>
  )
}
