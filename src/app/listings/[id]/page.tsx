import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatPrice, formatDimensions, getImageUrl } from '@/lib/format'
import { uploadImage, deleteImage } from './actions'

type ListingDetail = {
  id: string
  workshop_id: string
  material: string
  finish: string
  length_mm: number
  width_mm: number
  thickness_mm: number
  quantity: number
  price_pence: number
  description: string | null
  status: string
  workshops: { name: string }
  listing_images: { id: string; storage_path: string; position: number }[]
}

export default async function ListingPage({
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
      .select('*, workshops(name), listing_images(id, storage_path, position)')
      .eq('id', id)
      .single(),
    supabase
      .from('profiles')
      .select('workshop_id, workshops(name)')
      .eq('id', user.id)
      .single(),
  ])

  if (!listing) notFound()

  if (!profile?.workshop_id) redirect('/onboarding')

  const isOwner = listing.workshop_id === profile.workshop_id
  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const typedListing = listing as unknown as ListingDetail
  const images = [...typedListing.listing_images].sort((a, b) => a.position - b.position)

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

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* Photos */}
          <div className="flex flex-col gap-4">
            {images.length > 0 ? (
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
                          <form action={deleteImage.bind(null, img.id, id)} className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                            <button type="submit" className="text-xs text-white font-medium">Remove</button>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-100">
                <p className="text-sm text-stone-400">No photos yet</p>
              </div>
            )}

            {/* Upload form — owner only */}
            {isOwner && (
              <form
                action={uploadAction}
                encType="multipart/form-data"
                className="rounded-xl border border-stone-200 bg-white p-4"
              >
                <p className="mb-3 text-sm font-medium text-stone-700">Add a photo</p>
                <div className="flex gap-3">
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="flex-1 text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
                  >
                    Upload
                  </button>
                </div>
                <p className="mt-2 text-xs text-stone-400">JPEG, PNG or WebP · max 5MB</p>
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
                </div>
                <p className="text-2xl font-bold text-amber-700">{formatPrice(typedListing.price_pence)}</p>
              </div>

              <dl className="divide-y divide-stone-100 text-sm">
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
                  <dd className="font-medium text-stone-900">{typedListing.workshops.name}</dd>
                </div>
              </dl>

              {typedListing.description && (
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-400">Description</p>
                  <p className="text-sm text-stone-700">{typedListing.description}</p>
                </div>
              )}
            </div>

            {!isOwner && (
              <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
                <p className="text-sm text-stone-400">Messaging coming soon</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
