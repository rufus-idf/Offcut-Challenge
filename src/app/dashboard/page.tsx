export const metadata = { title: 'My Stock' }

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatPrice, formatDimensions } from '@/lib/format'
import Image from 'next/image'
import { StockSearch } from './stock-search'
import { markAsSold, archiveItem, relistItem, unlistItem } from './actions'
import { SubmitButton } from '@/components/submit-button'
import { ConfirmButton } from '@/components/confirm-button'
import { SHAPE_LABELS } from '@/components/shape-preview'
import { ShapePreviewModal } from '@/components/shape-preview-modal'
import { getImageUrl } from '@/lib/format'
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

type ListingRef  = { id: string; price_pence: number; quantity: number; status: string }
type StockImage  = { storage_path: string; position: number }
type StockWithListing = StockItem & {
  listings:     ListingRef  | ListingRef[]  | null
  stock_images: StockImage  | StockImage[]  | null
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; filter?: string; page?: string; q?: string }>
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
  const { message, filter, page: pageParam, q: searchQuery } = await searchParams
  const activeFilter = filter ?? 'all'
  const PAGE_SIZE = 30
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  let stockQuery = supabase
    .from('stock_items')
    .select('*, listings(id, price_pence, quantity, status), stock_images(storage_path, position)', { count: 'exact' })
    .eq('workshop_id', profile.workshop_id)
    .order('created_at', { ascending: false })

  if (activeFilter === 'listed')    stockQuery = stockQuery.eq('status', 'listed')
  if (activeFilter === 'available') stockQuery = stockQuery.eq('status', 'available')
  if (activeFilter === 'sold')      stockQuery = stockQuery.eq('status', 'sold')
  if (activeFilter === 'archived')  stockQuery = stockQuery.eq('status', 'archived')
  if (searchQuery) {
    const q = searchQuery.trim().replace(/[%_]/g, '')
    stockQuery = stockQuery.or(`material.ilike.%${q}%,finish.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data: rawItems, count: totalItems } = await stockQuery.range(offset, offset + PAGE_SIZE - 1)
  const totalPages = Math.max(1, Math.ceil((totalItems ?? 0) / PAGE_SIZE))

  const dashPageUrl = (p: number) => {
    const sp = new URLSearchParams()
    if (activeFilter !== 'all') sp.set('filter', activeFilter)
    if (searchQuery)            sp.set('q', searchQuery)
    if (p > 1)                  sp.set('page', String(p))
    const qs = sp.toString()
    return `/dashboard${qs ? `?${qs}` : ''}`
  }

  const tabUrl = (key: string) => {
    const sp = new URLSearchParams()
    if (key !== 'all') sp.set('filter', key)
    if (searchQuery)   sp.set('q', searchQuery)
    return `/dashboard${sp.toString() ? `?${sp}` : ''}`
  }

  // Normalise has-many joins from Supabase
  const stockItems: StockWithListing[] = (rawItems ?? []).map(item => ({
    ...item,
    listings:     Array.isArray(item.listings)     ? (item.listings[0]     ?? null) : item.listings,
    stock_images: Array.isArray(item.stock_images) ? item.stock_images               : (item.stock_images ? [item.stock_images] : []),
  }))

  const filterTabs = [
    { key: 'all',       label: 'All stock' },
    { key: 'available', label: 'In stock' },
    { key: 'listed',    label: 'Listed' },
    { key: 'sold',      label: 'Sold' },
    { key: 'archived',  label: 'Archived' },
  ]

  // Action pill styles — visual hierarchy for the Actions column
  const pillGreen   = 'inline-flex items-center rounded-full bg-[#3DBE72] px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#2A9E5A] disabled:opacity-60'
  const pillNeutral = 'inline-flex items-center rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:opacity-40'
  const pillDark    = 'inline-flex items-center rounded-full bg-stone-800 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-60'
  const pillMuted   = 'inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-400 transition-colors hover:border-stone-300 hover:text-stone-600 disabled:opacity-40'

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={workshop?.name} />

      <main className="px-8 py-10">

        {/* Verification banners */}
        {workshop?.verification_status === 'unverified' && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[#3DBE72]/20 bg-[#E8F7EE] px-5 py-4">
            <p className="text-sm text-[#1C7040]">
              <span className="font-semibold">Verification required.</span>{' '}
              Submit your Companies House details to start listing offcuts.
            </p>
            <Link href="/verification" className="ml-4 shrink-0 rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A9E5A]">
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
              className="rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A9E5A]"
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

        {/* Stock search */}
        <StockSearch initialValue={searchQuery ?? ''} activeFilter={activeFilter} />

        {/* Filter tabs */}
        <div className="mb-4 flex gap-1">
          {filterTabs.map(tab => (
            <Link
              key={tab.key}
              href={tabUrl(tab.key)}
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
              <Link href="/listings/new" className="rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A9E5A]">
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
                  <th className="px-4 py-3">Marketplace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stockItems.map(item => {
                  const listing = item.listings as ListingRef | null
                  const images  = (item.stock_images as StockImage[] | null) ?? []
                  const firstPhoto = [...images].sort((a, b) => a.position - b.position)[0] ?? null
                  return (
                    <tr key={item.id} className="hover:bg-stone-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {/* Photo thumbnail — shown first when available */}
                          {firstPhoto && (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                              <Image
                                src={getImageUrl(firstPhoto.storage_path)}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          )}
                          {/* Shape SVG — always shown */}
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="h-10 w-14">
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
                      <td className="px-5 py-3 text-stone-600">
                        {listing && listing.quantity < item.quantity ? (
                          <span>
                            {listing.quantity} listed
                            <span className="block text-xs text-stone-400">{item.quantity} total</span>
                          </span>
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium text-stone-900">
                        {listing ? formatPrice(listing.price_pence) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.status === 'available' && (
                            <>
                              <Link href={`/stock/${item.id}/edit`} className={pillNeutral}>
                                Edit
                              </Link>
                            </>
                          )}
                          {listing && item.status === 'listed' && (
                            <>
                              <Link href={`/listings/${listing.id}`} className={pillNeutral}>
                                View
                              </Link>
                              <Link href={`/listings/${listing.id}/edit`} className={pillNeutral}>
                                Edit
                              </Link>
                              <Link href={`/stock/${item.id}/reduce-qty`} className={pillNeutral}>
                                Sold some
                              </Link>
                              <form action={unlistItem.bind(null, item.id, listing.id)}>
                                <SubmitButton pendingText="…" className={pillNeutral}>
                                  Unlist
                                </SubmitButton>
                              </form>
                              <ConfirmButton
                                action={markAsSold.bind(null, item.id, listing.id)}
                                label="Mark sold"
                                className={pillDark}
                              />
                              <ConfirmButton
                                action={archiveItem.bind(null, item.id, listing.id)}
                                label="Archive"
                                className={pillMuted}
                              />
                            </>
                          )}
                          {listing && (item.status === 'sold' || item.status === 'archived') && (
                            <form action={relistItem.bind(null, item.id, listing.id)}>
                              <SubmitButton pendingText="…" className={pillGreen}>
                                Relist
                              </SubmitButton>
                            </form>
                          )}
                        </div>
                      </td>
                      {/* Marketplace — far right */}
                      <td className="px-4 py-3">
                        {item.status === 'available' ? (
                          <Link
                            href={`/stock/${item.id}/publish`}
                            className="inline-flex items-center gap-2 rounded-full bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2A9E5A]"
                            style={{ boxShadow: '0 2px 10px rgba(61,190,114,0.30)' }}
                          >
                            Publish to marketplace
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </Link>
                        ) : (
                          <span className="text-xs text-stone-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Dashboard pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link href={dashPageUrl(page - 1)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
                ← Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-300">← Previous</span>
            )}
            <span className="text-sm text-stone-500">Page {page} of {totalPages}</span>
            {page < totalPages ? (
              <Link href={dashPageUrl(page + 1)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
                Next →
              </Link>
            ) : (
              <span className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-300">Next →</span>
            )}
          </div>
        )}

        {/* Camera app upgrade banner */}
        {workshop?.verification_status === 'approved' && (
          <Link
            href="/camera"
            className="mt-10 flex items-center justify-between gap-4 rounded-xl border border-[#3DBE72]/20 bg-[#E8F7EE] px-6 py-4 transition-colors hover:bg-[#E8F7EE]"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">📷</span>
              <div>
                <p className="font-semibold text-[#1C7040]">Camera App Integration</p>
                <p className="text-sm text-[#2A9E5A]">
                  Automatically scan and catalogue offcuts directly into your stock — no manual entry needed.
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white">
              Learn more →
            </span>
          </Link>
        )}
      </main>
    </div>
  )
}
