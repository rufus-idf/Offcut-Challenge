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
  price_pence: number
  description: string | null
  status: string
  workshops: { name: string; slug: string; town: string | null; county: string | null }
  listing_images: { id: string; storage_path: string; position: number }[]
  stock_items: StockShape | null
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

  // Fetch more listings from the same workshop (excluding this one)
  const { data: moreRaw } = await supabase
    .from('listings')
    .select('id, material, finish, price_pence, length_mm, width_mm, thickness_mm, listing_images(storage_path, position)')
    .eq('workshop_id', listing.workshop_id)
    .eq('status', 'active')
    .neq('id', id)
    .order('created_at', { ascending: false })
    .limit(4)

  const moreListings = moreRaw ?? []

  if (!profile?.workshop_id) redirect('/onboarding')

  const isOwner = listing.workshop_id === profile.workshop_id
  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const typedListing = listing as unknown as ListingDetail
  const images = [...typedListing.listing_images].sort((a, b) => a.position - b.position)
  const shape = Array.isArray(typedListing.stock_items)
    ? (typedListing.stock_items[0] ?? null)
    : typedListing.stock_items

  const uploadAction = uploadImage.bind(null, id)

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-5xl px-6 py-10">
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

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* Photos */}
          <div className="flex flex-col gap-4">
            {images.length > 0 && (
              <>
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-stone-100">
                  <Image
                    src={getImageUrl(images[0].storage_path)}
                    alt={`${typedListing.material} ${typedListing.finish}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                  />
                  {isOwner && (
                    <form action={deleteImage.bind(null, images[0].id, id)} className="absolute right-2 top-2">
                      <button
                        type="submit"
                        className="rounded-full bg-black/50 px-2 py-1 text-xs text-white hover:bg-black/70"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(1).map(img => (
                      <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
                        <Image
                          src={getImageUrl(img.storage_path)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="25vw"
                        />
                        {isOwner && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                            <form action={setImageAsCover.bind(null, img.id, id)}>
                              <button type="submit" className="text-xs text-white font-semibold bg-white/20 rounded px-2 py-0.5 hover:bg-white/30">Set as cover</button>
                            </form>
                            <form action={deleteImage.bind(null, img.id, id)}>
                              <button type="submit" className="text-xs text-white font-medium hover:underline">Remove</button>
                            </form>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Shape diagram — always shown so buyers always know exact dimensions */}
            <div className="rounded-xl border border-stone-200 bg-stone-50">
              <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-stone-400">
                Shape &amp; dimensions — click to enlarge
              </p>
              <div className="h-56 p-4">
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
            </div>

            {/* Upload form — owner only */}
            {isOwner && (
              <form
                action={uploadAction}
                encType="multipart/form-data"
                className="rounded-xl border border-stone-200 bg-white p-4"
              >
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
                    className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
                  >
                    Upload
                  </SubmitButton>
                </div>
                <p className="mt-2 text-xs text-stone-400">JPEG, PNG or WebP · max 5MB each</p>
              </form>
            )}
          </div>

          {/* Listing info */}
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">{typedListing.material}</h1>
                  <p className="text-stone-500">{typedListing.finish}</p>
                  {isOwner && (
                    <Link href={`/listings/${id}/edit`} className="mt-1 inline-block text-xs text-amber-700 hover:underline">
                      Edit listing
                    </Link>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-700">{formatPrice(typedListing.price_pence)}</p>
                  <p className="text-xs text-stone-400">per piece</p>
                </div>
              </div>

              {/* Shape diagram */}
              <div className="mb-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-stone-500">Shape</p>
                  <span className="text-xs text-stone-400">
                    {SHAPE_LABELS[shape?.shape_type ?? 'RECT'] ?? shape?.shape_type ?? 'Rectangle'}
                  </span>
                </div>
                <div className="h-44 w-full rounded-lg border border-stone-100 bg-stone-50">
                  <ShapePreviewModal
                    shapeType={shape?.shape_type ?? 'RECT'}
                    verticesMm={shape?.vertices_mm ?? null}
                    lengthMm={typedListing.length_mm}
                    widthMm={typedListing.width_mm}
                    thicknessMm={typedListing.thickness_mm}
                    bboxWMm={shape?.bbox_w_mm ?? null}
                    bboxHMm={shape?.bbox_h_mm ?? null}
                    thumbnailShowLabels={true}
                  />
                </div>
              </div>

              <dl className="divide-y divide-stone-100 text-sm">
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
                  <dt className="text-stone-500">Quantity available</dt>
                  <dd className="font-medium text-stone-900">{typedListing.quantity}</dd>
                </div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-stone-500">Sold by</dt>
                  <dd className="font-medium text-stone-900">
                    <Link href={`/workshops/${typedListing.workshops.slug}`} className="hover:text-amber-700 hover:underline">
                      {typedListing.workshops.name}
                    </Link>
                  </dd>
                </div>
                {typedListing.workshops.town && (
                  <div className="flex justify-between py-2.5">
                    <dt className="text-stone-500">Ships from</dt>
                    <dd className="font-medium text-stone-900">
                      {[typedListing.workshops.town, typedListing.workshops.county].filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
              </dl>

              {typedListing.description && (
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400">Description</p>
                  <p className="text-sm text-stone-700">{typedListing.description}</p>
                </div>
              )}
            </div>

            {isOwner ? (
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-4 text-center">
                <p className="text-sm text-stone-400">This is your listing</p>
              </div>
            ) : (
              <QuantityEnquiry
                listingId={id}
                maxQty={typedListing.quantity}
                pricePence={typedListing.price_pence}
              />
            )}
          </div>

        </div>

        {/* More from this workshop */}
        {moreListings.length > 0 && (
          <div className="mt-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">
                More from {typedListing.workshops.name}
              </h2>
              <Link
                href={`/workshops/${typedListing.workshops.slug}`}
                className="text-sm text-amber-700 hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {moreListings.map((item: any) => {
                const imgs = [...(item.listing_images ?? [])].sort((a: any, b: any) => a.position - b.position)
                return (
                  <Link
                    key={item.id}
                    href={`/listings/${item.id}`}
                    className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] bg-stone-100">
                      {imgs[0] ? (
                        <Image
                          src={getImageUrl(imgs[0].storage_path)}
                          alt={`${item.material} ${item.finish}`}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          sizes="25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-xs text-stone-400">{item.material}</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-stone-900 group-hover:text-amber-700 transition-colors">{item.material}</p>
                      <p className="text-xs text-stone-500">{item.finish}</p>
                      <p className="mt-1 font-bold text-amber-700">{formatPrice(item.price_pence)}</p>
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
