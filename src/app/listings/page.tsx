export const metadata = { title: 'Browse Listings' }

import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatPrice, formatDimensions, getImageUrl, formatDistance } from '@/lib/format'
import { ListingsFilters } from './listings-filters'
import { SHAPE_LABELS } from '@/components/shape-preview'
import { ShapePreviewModal } from '@/components/shape-preview-modal'
import { geocodePostcode, haversineKm } from '@/lib/geocode'
import type { ListingWithWorkshop } from '@/lib/types'

type ListingWithDist = ListingWithWorkshop & { _distKm: number }

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    category?: string
    material?: string
    finish?: string
    max_price?: string
    sort?: string
    postcode?: string
    hide_own?: string
    page?: string
    view?: string
    min_length?: string
    max_length?: string
    min_width?: string
    max_width?: string
    min_thickness?: string
    max_thickness?: string
  }>
}) {
  const filters = await searchParams
  const PAGE_SIZE = 24
  const page = Math.max(1, parseInt(filters.page ?? '1', 10))

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  // Geocode the user's postcode if provided
  let userCoords: { lat: number; lng: number } | null = null
  let postcodeInvalid = false
  if (filters.postcode) {
    userCoords = await geocodePostcode(filters.postcode)
    if (!userCoords) postcodeInvalid = true
  }

  let query = supabase
    .from('listings')
    .select('*, workshops(name, town, county, lat, lng), listing_images(storage_path, position), stock_items(shape_type, vertices_mm, bbox_w_mm, bbox_h_mm)', { count: 'exact' })
    .eq('status', 'active')

  if (filters.q) {
    const q = filters.q.trim().replace(/[%_]/g, '')
    // Also match on workshop name — fetch IDs first then include in OR
    const { data: matchingWorkshops } = await supabase
      .from('workshops')
      .select('id')
      .ilike('name', `%${q}%`)
    const workshopIds = (matchingWorkshops ?? []).map(w => w.id)
    const workshopClause = workshopIds.length > 0 ? `,workshop_id.in.(${workshopIds.join(',')})` : ''
    query = query.or(`material.ilike.%${q}%,finish.ilike.%${q}%,description.ilike.%${q}%${workshopClause}`)
  }
  if (filters.category)  query = query.eq('category', filters.category)
  if (filters.material)  query = query.eq('material', filters.material)
  if (filters.finish)    query = query.eq('finish', filters.finish)
  if (filters.max_price) query = query.lte('price_pence', Math.round(parseFloat(filters.max_price) * 100))
  if (filters.hide_own === '1' && profile.workshop_id) {
    query = query.neq('workshop_id', profile.workshop_id)
  }
  if (filters.min_length)    query = query.gte('length_mm',    parseInt(filters.min_length, 10))
  if (filters.max_length)    query = query.lte('length_mm',    parseInt(filters.max_length, 10))
  if (filters.min_width)     query = query.gte('width_mm',     parseInt(filters.min_width, 10))
  if (filters.max_width)     query = query.lte('width_mm',     parseInt(filters.max_width, 10))
  if (filters.min_thickness) query = query.gte('thickness_mm', parseInt(filters.min_thickness, 10))
  if (filters.max_thickness) query = query.lte('thickness_mm', parseInt(filters.max_thickness, 10))

  // Sort — distance overrides when a valid postcode is given
  if (filters.sort === 'price_asc')  query = query.order('price_pence', { ascending: true })
  else if (filters.sort === 'price_desc') query = query.order('price_pence', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  let totalCount = 0
  let listings: ListingWithDist[] = []

  if (userCoords) {
    // Fetch all for distance sorting, then paginate in JS
    const { data: raw } = await query
    const all: ListingWithDist[] = (raw ?? []).map(l => {
      const w = (l as ListingWithWorkshop).workshops
      const _distKm = w.lat != null && w.lng != null
        ? haversineKm(userCoords.lat, userCoords.lng, w.lat, w.lng)
        : Infinity
      return { ...(l as ListingWithWorkshop), _distKm }
    })
    all.sort((a, b) => a._distKm - b._distKm)
    totalCount = all.length
    listings = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  } else {
    // Server-side pagination
    const offset = (page - 1) * PAGE_SIZE
    const { data: raw, count } = await query.range(offset, offset + PAGE_SIZE - 1)
    totalCount = count ?? 0
    listings = (raw ?? []).map(l => ({ ...(l as ListingWithWorkshop), _distKm: Infinity }))
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const hasFilters = !!(
    filters.q || filters.category || filters.material || filters.finish ||
    filters.max_price || filters.postcode || filters.sort || filters.hide_own ||
    filters.min_length || filters.max_length || filters.min_width || filters.max_width ||
    filters.min_thickness || filters.max_thickness
  )

  // Build a URL with the current filters but a different page
  const paginationUrl = (p: number) => {
    const sp = new URLSearchParams()
    if (filters.q)            sp.set('q',            filters.q)
    if (filters.category)     sp.set('category',     filters.category)
    if (filters.material)     sp.set('material',     filters.material)
    if (filters.finish)       sp.set('finish',       filters.finish)
    if (filters.max_price)    sp.set('max_price',    filters.max_price)
    if (filters.sort)         sp.set('sort',         filters.sort)
    if (filters.postcode)     sp.set('postcode',     filters.postcode)
    if (filters.hide_own)     sp.set('hide_own',     filters.hide_own)
    if (filters.min_length)   sp.set('min_length',   filters.min_length)
    if (filters.max_length)   sp.set('max_length',   filters.max_length)
    if (filters.min_width)    sp.set('min_width',    filters.min_width)
    if (filters.max_width)    sp.set('max_width',    filters.max_width)
    if (filters.min_thickness) sp.set('min_thickness', filters.min_thickness)
    if (filters.max_thickness) sp.set('max_thickness', filters.max_thickness)
    if (filters.view && filters.view !== 'grid') sp.set('view', filters.view)
    if (p > 1)                sp.set('page',         String(p))
    const qs = sp.toString()
    return `/listings${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900">Browse listings</h1>
          <Link
            href="/listings/new"
            className="rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2A9E5A]"
          >
            + New listing
          </Link>
        </div>

        <ListingsFilters filters={filters} />

        {postcodeInvalid && (
          <p className="mb-4 rounded-lg bg-[#E8F7EE] px-4 py-3 text-sm text-[#2A9E5A]">
            Postcode &ldquo;{filters.postcode}&rdquo; wasn&apos;t recognised — showing all results instead.
          </p>
        )}

        <p className="mb-4 text-sm text-stone-500">
          {totalCount} listing{totalCount !== 1 ? 's' : ''}
          {filters.q ? ` matching "${filters.q}"` : ''}
          {userCoords ? ' · sorted nearest first' : filters.sort === 'price_asc' ? ' · price low to high' : filters.sort === 'price_desc' ? ' · price high to low' : ''}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
        </p>

        {!listings.length ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white py-20 text-center">
            <p className="text-stone-500">
              {hasFilters ? 'No listings match those filters.' : 'No listings yet. Be the first to post one.'}
            </p>
            {!hasFilters && (
              <Link href="/listings/new" className="mt-4 inline-block rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A9E5A]">
                Post a listing
              </Link>
            )}
          </div>
        ) : (
          <>
          {/* Grid views */}
          {filters.view !== 'list' && (
            <div className={`grid gap-4 ${filters.view === 'wide' ? 'sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {listings.map(listing => {
                const firstImage = [...listing.listing_images].sort((a, b) => a.position - b.position)[0]
                type StockSnap = { shape_type: string; vertices_mm: number[][] | null; bbox_w_mm: number | null; bbox_h_mm: number | null }
                const rawSnap = (listing as unknown as { stock_items: StockSnap | StockSnap[] | null }).stock_items
                const stock = Array.isArray(rawSnap) ? (rawSnap[0] ?? null) : rawSnap
                const shapeType = stock?.shape_type
                return (
                  <Link key={listing.id} href={`/listings/${listing.id}`} className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative aspect-[4/3] bg-stone-100">
                      {firstImage ? (
                        <Image src={getImageUrl(firstImage.storage_path)} alt={`${listing.material} ${listing.finish}`} fill className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" sizes="25vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-stone-50 p-4">
                          <ShapePreviewModal shapeType={stock?.shape_type ?? 'RECT'} verticesMm={stock?.vertices_mm ?? null} lengthMm={listing.length_mm} widthMm={listing.width_mm} thicknessMm={listing.thickness_mm} bboxWMm={stock?.bbox_w_mm ?? null} bboxHMm={stock?.bbox_h_mm ?? null} thumbnailShowLabels thumbnailClassName="h-full w-full" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-stone-900">{listing.material}</p>
                          <p className="text-sm text-stone-500">{listing.finish}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#2A9E5A]">{formatPrice(listing.price_pence)}</p>
                          <p className="text-xs text-stone-400">per piece</p>
                        </div>
                      </div>
                      <p className="text-sm text-stone-600">{formatDimensions(listing.length_mm, listing.width_mm, listing.thickness_mm)}</p>
                      <p className="mt-0.5 text-sm text-stone-400">Qty: {listing.quantity}</p>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <div>
                          <p className="text-xs text-stone-400">{listing.workshops.name}</p>
                          {listing.workshops.town && <p className="text-xs text-stone-400">{listing.workshops.town}{listing.workshops.county ? `, ${listing.workshops.county}` : ''}</p>}
                          {userCoords && listing._distKm !== Infinity && <p className="mt-0.5 text-xs font-medium text-[#2A9E5A]">{formatDistance(listing._distKm)}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{listing.category}</span>
                          {shapeType && shapeType !== 'RECT' && <span className="rounded-full bg-[#E8F7EE] px-2 py-0.5 text-xs text-[#2A9E5A]">{SHAPE_LABELS[shapeType] ?? shapeType}</span>}
                          {listing.discount_min_qty && listing.discount_pct && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Buy {listing.discount_min_qty}+ · {listing.discount_pct}% off
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* List view — compact rows, maximum density */}
          {filters.view === 'list' && (
            <div className="flex flex-col divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white shadow-sm">
              {listings.map(listing => {
                const firstImage = [...listing.listing_images].sort((a, b) => a.position - b.position)[0]
                type StockSnap = { shape_type: string; vertices_mm: number[][] | null; bbox_w_mm: number | null; bbox_h_mm: number | null }
                const rawSnap = (listing as unknown as { stock_items: StockSnap | StockSnap[] | null }).stock_items
                const stock = Array.isArray(rawSnap) ? (rawSnap[0] ?? null) : rawSnap
                return (
                  <Link key={listing.id} href={`/listings/${listing.id}`} className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-stone-50">
                    {/* Thumbnail */}
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      {firstImage ? (
                        <Image src={getImageUrl(firstImage.storage_path)} alt="" fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2">
                          <ShapePreviewModal shapeType={stock?.shape_type ?? 'RECT'} verticesMm={stock?.vertices_mm ?? null} lengthMm={listing.length_mm} widthMm={listing.width_mm} thicknessMm={listing.thickness_mm} bboxWMm={stock?.bbox_w_mm ?? null} bboxHMm={stock?.bbox_h_mm ?? null} thumbnailClassName="h-full w-full" />
                        </div>
                      )}
                    </div>
                    {/* Material + finish */}
                    <div className="w-40 shrink-0">
                      <p className="font-semibold text-stone-900 group-hover:text-[#2A9E5A] transition-colors">{listing.material}</p>
                      <p className="text-sm text-stone-500">{listing.finish}</p>
                    </div>
                    {/* Dimensions */}
                    <p className="w-40 shrink-0 text-sm text-stone-600">{formatDimensions(listing.length_mm, listing.width_mm, listing.thickness_mm)}</p>
                    {/* Qty */}
                    <p className="w-20 shrink-0 text-sm text-stone-500">Qty {listing.quantity}</p>
                    {/* Workshop */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-stone-500">{listing.workshops.name}</p>
                      {listing.workshops.town && <p className="truncate text-xs text-stone-400">{listing.workshops.town}{listing.workshops.county ? `, ${listing.workshops.county}` : ''}</p>}
                      {userCoords && listing._distKm !== Infinity && <p className="text-xs font-medium text-[#2A9E5A]">{formatDistance(listing._distKm)}</p>}
                    </div>
                    {/* Category + discount */}
                    <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{listing.category}</span>
                    {listing.discount_min_qty && listing.discount_pct && (
                      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {listing.discount_pct}% off {listing.discount_min_qty}+
                      </span>
                    )}
                    {/* Price */}
                    <p className="shrink-0 font-bold text-[#2A9E5A]">{formatPrice(listing.price_pence)}</p>
                    <svg className="h-4 w-4 shrink-0 text-stone-300 group-hover:text-[#3DBE72] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {page > 1 ? (
                <Link href={paginationUrl(page - 1)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
                  ← Previous
                </Link>
              ) : (
                <span className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-300">← Previous</span>
              )}
              <span className="text-sm text-stone-500">Page {page} of {totalPages}</span>
              {page < totalPages ? (
                <Link href={paginationUrl(page + 1)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
                  Next →
                </Link>
              ) : (
                <span className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-300">Next →</span>
              )}
            </div>
          )}
        </>
        )}
      </main>
    </div>
  )
}
