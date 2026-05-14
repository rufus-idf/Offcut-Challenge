import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatPrice, formatDimensions, getImageUrl } from '@/lib/format'
import { SHAPE_LABELS } from '@/components/shape-preview'
import { ShapePreviewModal } from '@/components/shape-preview-modal'
import { uploadImage, deleteImage, setImageAsCover } from './actions'
import { QuantityEnquiry } from '@/components/quantity-enquiry'
import { SubmitButton } from '@/components/submit-button'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('material, finish, length_mm, width_mm, thickness_mm')
    .eq('id', id)
    .single()
  if (!data) return { title: 'Listing' }
  const dims = data.length_mm && data.width_mm
    ? ` ${data.length_mm}×${data.width_mm}×${data.thickness_mm}mm`
    : ''
  return { title: `${data.material} — ${data.finish}${dims}` }
}

type StockShape = {
  shape_type: string
  vertices_mm: number[][] | null
  svg_path_data: string | null
  bbox_w_mm: number | null
  bbox_h_mm: number | null
}

type ListingDetail = {
  id: string
  workshop_id: string
  category: string
  material: string
  finish: string
  length_mm: number
  width_mm: number
  thickness_mm: number
  quantity: number
  price_pence:      number
  description:      string | null
  status:           string
  discount_min_qty: number | null
  discount_pct:     number | null
  workshops: { name: string; slug: string; town: string | null; county: string | null }
  listing_images: { id: string; storage_path: string; position: number }[]
  stock_items: StockShape | null
}

type MoreItem = {
  id: string
  material: string
  finish: string
  price_pence: number
  length_mm: number | null
  width_mm: number | null
  thickness_mm: number | null
  listing_images: { storage_path: string; position: number }[]
  stock_items: { shape_type: string; vertices_mm: number[][] | null; bbox_w_mm: number | null; bbox_h_mm: number | null } | null
}

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; enquired?: string }>
}) {
  const { id } = await params
  const { error, enquired } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: listing }, { data: profile }] = await Promise.all([
    supabase
      .from('listings')
      .select('*, workshops(name, slug, town, county), listing_images(id, storage_path, position), stock_items(shape_type, vertices_mm, svg_path_data, bbox_w_mm, bbox_h_mm)')
      .eq('id', id)
      .single(),
    supabase
      .from('profiles')
      .select('workshop_id, workshops(name)')
      .eq('id', user.id)
      .single(),
  ])

  if (!listing) notFound()

  const { data: moreRaw } = await supabase
    .from('listings')
    .select('id, material, finish, price_pence, length_mm, width_mm, thickness_mm, listing_images(storage_path, position), stock_items(shape_type, vertices_mm, bbox_w_mm, bbox_h_mm)')
    .eq('workshop_id', listing.workshop_id)
    .eq('status', 'active')
    .neq('id', id)
    .order('created_at', { ascending: false })
    .limit(6)

  const moreListings: MoreItem[] = (moreRaw ?? []).map((item: any) => ({
    ...item,
    stock_items: Array.isArray(item.stock_items) ? (item.stock_items[0] ?? null) : item.stock_items,
  }))

  if (!profile?.workshop_id) redirect('/onboarding')

  const isOwner = listing.workshop_id === profile.workshop_id
  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const typedListing = listing as unknown as ListingDetail
  const images = [...typedListing.listing_images].sort((a, b) => a.position - b.position)
  const shape = Array.isArray(typedListing.stock_items)
    ? (typedListing.stock_items[0] ?? null)
    : typedListing.stock_items

  const uploadAction = uploadImage.bind(null, id)
  const hasDiscount = !!(typedListing.discount_min_qty && typedListing.discount_pct)

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="px-8 py-10">
        <Link href="/listings" className="mb-8 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          ← Browse listings
        </Link>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {enquired === '1' && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <p className="font-semibold text-green-800">Enquiry sent!</p>
            <p className="mt-0.5 text-sm text-green-700">
              We&apos;ve notified the seller. They&apos;ll be in touch to arrange payment and collection.
            </p>
          </div>
        )}

        {/* eBay-style layout: thumbnails | main image | info */}
        <div className="grid gap-6 lg:grid-cols-[80px_1fr_380px]">

          {/* THUMBNAIL STRIP — desktop only */}
          <div className="hidden lg:flex flex-col gap-2">
            {/* Shape preview thumbnail — always first */}
            <div className="aspect-square overflow-hidden rounded-lg border border-amber-200 bg-stone-50 p-1.5">
              <ShapePreviewModal
                shapeType={shape?.shape_type ?? 'RECT'}
                verticesMm={shape?.vertices_mm ?? null}
                lengthMm={typedListing.length_mm}
                widthMm={typedListing.width_mm}
                thicknessMm={typedListing.thickness_mm}
                bboxWMm={shape?.bbox_w_mm ?? null}
                bboxHMm={shape?.bbox_h_mm ?? null}
                thumbnailShowLabels={false}
                thumbnailClassName="h-full w-full"
              />
            </div>

            {/* Photo thumbnails */}
            {images.map((img, i) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                <Image
                  src={getImageUrl(img.storage_path)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {isOwner && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                    {i > 0 && (
                      <form action={setImageAsCover.bind(null, img.id, id)}>
                        <button type="submit" className="text-[9px] font-semibold text-white hover:underline">Cover</button>
                      </form>
                    )}
                    <form action={deleteImage.bind(null, img.id, id)}>
                      <button type="submit" className="text-[9px] text-white/80 hover:underline">Remove</button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* MAIN VISUAL — centre */}
          <div className="flex flex-col gap-4">
            {/* Main image or shape preview */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-50">
              {images.length > 0 ? (
                <Image
                  src={getImageUrl(images[0].storage_path)}
                  alt={`${typedListing.material} ${typedListing.finish}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center p-10">
                  <ShapePreviewModal
                    shapeType={shape?.shape_type ?? 'RECT'}
                    verticesMm={shape?.vertices_mm ?? null}
                    lengthMm={typedListing.length_mm}
                    widthMm={typedListing.width_mm}
                    thicknessMm={typedListing.thickness_mm}
                    bboxWMm={shape?.bbox_w_mm ?? null}
                    bboxHMm={shape?.bbox_h_mm ?? null}
                    thumbnailShowLabels={true}
                    thumbnailClassName="h-full w-full"
                  />
                </div>
              )}
            </div>

            {/* Mobile-only: horizontal photo strip */}
            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {/* Shape preview as first thumbnail on mobile */}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-amber-200 bg-stone-50 p-1">
                  <ShapePreviewModal
                    shapeType={shape?.shape_type ?? 'RECT'}
                    verticesMm={shape?.vertices_mm ?? null}
                    lengthMm={typedListing.length_mm}
                    widthMm={typedListing.width_mm}
                    thicknessMm={typedListing.thickness_mm}
                    bboxWMm={shape?.bbox_w_mm ?? null}
                    bboxHMm={shape?.bbox_h_mm ?? null}
                    thumbnailShowLabels={false}
                    thumbnailClassName="h-full w-full"
                  />
                </div>
                {images.map(img => (
                  <div key={img.id} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                    <Image src={getImageUrl(img.storage_path)} alt="" fill className="object-cover" sizes="56px" />
                  </div>
                ))}
              </div>
            )}

            {/* Upload form — owner only */}
            {isOwner && (
              <form action={uploadAction} encType="multipart/form-data" className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="mb-1 text-sm font-medium text-stone-700">Add photos</p>
                <p className="mb-3 text-xs text-stone-400">Select multiple files at once to upload them all in one go.</p>
                <div className="flex gap-3">
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    required
                    className="flex-1 text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
                  />
                  <SubmitButton
                    pendingText="Uploading…"
                    className="rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A9E5A] disabled:opacity-60"
                  >
                    Upload
                  </SubmitButton>
                </div>
                <p className="mt-2 text-xs text-stone-400">JPEG, PNG or WebP · max 5MB each</p>
              </form>
            )}
          </div>

          {/* INFO CARD — right */}
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">

              {/* Title + edit */}
              <div className="mb-1 flex items-start justify-between gap-2">
                <h1 className="text-2xl font-bold text-stone-900 leading-tight">{typedListing.material}</h1>
                {isOwner && (
                  <Link href={`/listings/${id}/edit`} className="shrink-0 text-xs text-[#2A9E5A] hover:underline">
                    Edit
                  </Link>
                )}
              </div>
              <p className="text-stone-500">{typedListing.finish}</p>

              {/* Price */}
              <div className="mt-5 border-t border-stone-100 pt-5">
                <p className="text-3xl font-bold text-[#2A9E5A]">{formatPrice(typedListing.price_pence)}</p>
                <p className="mt-0.5 text-xs text-stone-400">per piece</p>
              </div>

              {/* Discount badge */}
              {hasDiscount && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs">
                  <span className="text-amber-500">🏷</span>
                  <span className="font-medium text-amber-800">
                    Buy {typedListing.discount_min_qty}+ and save {typedListing.discount_pct}%
                  </span>
                </div>
              )}

              {/* Details */}
              <dl className="mt-5 divide-y divide-stone-100 text-sm">
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500">Shape</dt>
                  <dd className="font-medium text-stone-900">
                    {SHAPE_LABELS[shape?.shape_type ?? 'RECT'] ?? shape?.shape_type ?? 'Rectangle'}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500">Category</dt>
                  <dd className="font-medium text-stone-900">{typedListing.category}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500">Dimensions</dt>
                  <dd className="font-medium text-stone-900">
                    {formatDimensions(typedListing.length_mm, typedListing.width_mm, typedListing.thickness_mm)}
                  </dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500">Quantity</dt>
                  <dd className="font-medium text-stone-900">{typedListing.quantity} available</dd>
                </div>
                {hasDiscount && (
                  <div className="flex justify-between py-2.5">
                    <dt className="text-stone-500">Bulk discount</dt>
                    <dd className="font-medium text-amber-700">
                      {typedListing.discount_pct}% off {typedListing.discount_min_qty}+ pieces
                    </dd>
                  </div>
                )}
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500">Seller</dt>
                  <dd className="font-medium text-stone-900">
                    <Link href={`/workshops/${typedListing.workshops.slug}`} className="hover:text-[#2A9E5A] hover:underline">
                      {typedListing.workshops.name}
                    </Link>
                  </dd>
                </div>
                {typedListing.workshops.town && (
                  <div className="flex justify-between py-2.5">
                    <dt className="text-stone-500">Location</dt>
                    <dd className="font-medium text-stone-900">
                      {[typedListing.workshops.town, typedListing.workshops.county].filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
              </dl>

              {typedListing.description && (
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">Description</p>
                  <p className="text-sm leading-relaxed text-stone-700">{typedListing.description}</p>
                </div>
              )}
            </div>

            {/* Enquiry or owner note */}
            {isOwner ? (
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 text-center">
                <p className="text-sm text-stone-400">This is your listing</p>
              </div>
            ) : (
              <QuantityEnquiry
                listingId={id}
                maxQty={typedListing.quantity}
                pricePence={typedListing.price_pence}
                discountMinQty={typedListing.discount_min_qty ?? null}
                discountPct={typedListing.discount_pct ?? null}
              />
            )}
          </div>

        </div>

        {/* More from this workshop — compact */}
        {moreListings.length > 0 && (
          <div className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
                More from {typedListing.workshops.name}
              </h2>
              <Link href={`/workshops/${typedListing.workshops.slug}`} className="text-sm text-[#2A9E5A] hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">
              {moreListings.map(item => {
                const imgs = [...(item.listing_images ?? [])].sort((a, b) => a.position - b.position)
                const itemStock = item.stock_items
                return (
                  <Link
                    key={item.id}
                    href={`/listings/${item.id}`}
                    className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-stone-50">
                      {imgs[0] ? (
                        <Image
                          src={getImageUrl(imgs[0].storage_path)}
                          alt={`${item.material} ${item.finish}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-3">
                          <ShapePreviewModal
                            shapeType={itemStock?.shape_type ?? 'RECT'}
                            verticesMm={itemStock?.vertices_mm ?? null}
                            lengthMm={item.length_mm}
                            widthMm={item.width_mm}
                            thicknessMm={item.thickness_mm ?? 0}
                            bboxWMm={itemStock?.bbox_w_mm ?? null}
                            bboxHMm={itemStock?.bbox_h_mm ?? null}
                            thumbnailShowLabels={false}
                            thumbnailClassName="h-full w-full"
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate text-xs font-semibold text-stone-900 transition-colors group-hover:text-[#2A9E5A]">{item.material}</p>
                      <p className="text-xs font-bold text-[#2A9E5A]">{formatPrice(item.price_pence)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
