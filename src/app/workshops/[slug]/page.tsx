import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatPrice, formatDimensions, getImageUrl, getLogoUrl } from '@/lib/format'
import Image from 'next/image'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('workshops')
    .select('name')
    .eq('slug', slug)
    .single()
  return { title: data?.name ?? 'Workshop' }
}

type Workshop = {
  id: string
  name: string
  slug: string
  town: string | null
  county: string | null
  verification_status: string
  created_at: string
  logo_url: string | null
  website_url: string | null
}

type ListingRow = {
  id: string
  material: string
  finish: string
  category: string
  length_mm: number | null
  width_mm: number | null
  thickness_mm: number | null
  quantity: number
  price_pence: number
  listing_images: { storage_path: string }[]
}

export default async function WorkshopProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: workshop }, { data: profile }] = await Promise.all([
    supabase
      .from('workshops')
      .select('id, name, slug, town, county, verification_status, created_at, logo_url, website_url')
      .eq('slug', slug)
      .eq('verification_status', 'approved')
      .single(),
    supabase
      .from('profiles')
      .select('workshop_id, workshops(name)')
      .eq('id', user.id)
      .single(),
  ])

  if (!workshop) notFound()
  if (!profile?.workshop_id) redirect('/onboarding')

  const { data: listings } = await supabase
    .from('listings')
    .select('id, material, finish, category, length_mm, width_mm, thickness_mm, quantity, price_pence, listing_images(storage_path)')
    .eq('workshop_id', workshop.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const viewerWorkshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const isOwnProfile = workshop.id === profile.workshop_id
  const typedListings = (listings ?? []) as unknown as ListingRow[]
  const location = [workshop.town, workshop.county].filter(Boolean).join(', ')
  const memberSince = new Date(workshop.created_at).getFullYear()

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={viewerWorkshopName} />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/workshops" className="mb-8 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          ← Workshop map
        </Link>

        {/* Workshop header */}
        <div className="mb-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
              {workshop.logo_url ? (
                <Image
                  src={getLogoUrl(workshop.logo_url)}
                  alt={`${workshop.name} logo`}
                  fill
                  className="object-contain p-1"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-2xl font-bold text-stone-300">
                    {workshop.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">{workshop.name}</h1>
                  {location && <p className="mt-0.5 text-stone-500">{location}</p>}
                  <p className="mt-0.5 text-xs text-stone-400">Member since {memberSince}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Verified
                  </span>
                  {isOwnProfile && (
                    <Link href="/settings" className="text-xs text-[#2A9E5A] hover:underline">
                      Edit profile
                    </Link>
                  )}
                </div>
              </div>

              {workshop.website_url && (
                <a
                  href={workshop.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-[#2A9E5A] hover:underline"
                >
                  {workshop.website_url.replace(/^https?:\/\//, '')}
                  <span className="text-xs">↗</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Active listings */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Active listings
            <span className="ml-2 text-base font-normal text-stone-400">
              ({typedListings.length} {typedListings.length === 1 ? 'item' : 'items'})
            </span>
          </h2>

          {typedListings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center">
              <p className="text-stone-400">No active listings from this workshop.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {typedListings.map(listing => {
                const images = Array.isArray(listing.listing_images) ? listing.listing_images : []
                const firstImage = images[0]
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden"
                  >
                    <div className="relative aspect-[4/3] bg-stone-100">
                      {firstImage ? (
                        <Image
                          src={getImageUrl(firstImage.storage_path)}
                          alt={`${listing.material} ${listing.finish}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <p className="text-xs text-stone-400">No photo</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-stone-900 group-hover:text-[#2A9E5A] transition-colors">
                            {listing.material}
                          </p>
                          <p className="text-sm text-stone-500">{listing.finish}</p>
                        </div>
                        <p className="shrink-0 font-bold text-[#2A9E5A]">{formatPrice(listing.price_pence)}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
                        {listing.length_mm && listing.width_mm ? (
                          <span>{formatDimensions(listing.length_mm, listing.width_mm, listing.thickness_mm ?? 0)}</span>
                        ) : (
                          <span>{listing.category}</span>
                        )}
                        <span>Qty {listing.quantity}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
