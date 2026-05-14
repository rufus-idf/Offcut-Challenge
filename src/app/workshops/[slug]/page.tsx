import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { getLogoUrl } from '@/lib/format'
import Image from 'next/image'
import { StarRating } from '@/components/star-rating'
import { WorkshopTabs } from './workshop-tabs'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('workshops').select('name').eq('slug', slug).single()
  return { title: data?.name ?? 'Workshop' }
}

type WorkshopInfo = {
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

type ReviewRow = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_workshop_id: string
}

type ReviewerWorkshop = { id: string; name: string; slug: string }

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

  const ws = workshop as unknown as WorkshopInfo

  const [{ data: listings }, { data: reviewRows }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, material, finish, category, length_mm, width_mm, thickness_mm, quantity, price_pence, discount_min_qty, discount_pct, listing_images(storage_path), stock_items(shape_type, vertices_mm, bbox_w_mm, bbox_h_mm)')
      .eq('workshop_id', ws.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_workshop_id')
      .eq('reviewed_workshop_id', ws.id)
      .order('created_at', { ascending: false }),
  ])

  // Fetch reviewer workshop names to avoid FK ambiguity
  const reviewerIds = [...new Set((reviewRows ?? []).map(r => r.reviewer_workshop_id))]
  const { data: reviewerWorkshops } = reviewerIds.length > 0
    ? await supabase.from('workshops').select('id, name, slug').in('id', reviewerIds)
    : { data: [] as ReviewerWorkshop[] }

  const workshopMap = Object.fromEntries(
    (reviewerWorkshops ?? []).map(w => [w.id, w as ReviewerWorkshop])
  )
  const reviews = ((reviewRows ?? []) as ReviewRow[]).map(r => ({
    ...r,
    reviewer: workshopMap[r.reviewer_workshop_id] ?? null,
  }))

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  const viewerWorkshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const isOwnProfile = ws.id === profile.workshop_id
  const location = [ws.town, ws.county].filter(Boolean).join(', ')
  const memberSince = new Date(ws.created_at).getFullYear()

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={viewerWorkshopName} />

      <main className="px-8 py-10">
        <Link href="/workshops" className="mb-8 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          ← Workshop map
        </Link>

        {/* Workshop header card */}
        <div className="mb-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
              {ws.logo_url ? (
                <Image src={getLogoUrl(ws.logo_url)} alt={`${ws.name} logo`} fill className="object-contain p-1" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-2xl font-bold text-stone-300">{ws.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">{ws.name}</h1>
                  {location && <p className="mt-0.5 text-stone-500">{location}</p>}
                  <p className="mt-0.5 text-xs text-stone-400">Member since {memberSince}</p>
                  {avgRating !== null && (
                    <div className="mt-2">
                      <StarRating rating={avgRating} count={reviews.length} size="sm" />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Verified
                  </span>
                  {isOwnProfile ? (
                    <Link href="/settings" className="text-xs text-[#2A9E5A] hover:underline">
                      Edit profile
                    </Link>
                  ) : (
                    <Link href={`/workshops/${slug}/review`} className="text-xs text-[#2A9E5A] hover:underline">
                      {reviews.some(r => r.reviewer_workshop_id === profile.workshop_id)
                        ? 'Edit your review'
                        : 'Leave a review'}
                    </Link>
                  )}
                </div>
              </div>

              {ws.website_url && (
                <a
                  href={ws.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-[#2A9E5A] hover:underline"
                >
                  {ws.website_url.replace(/^https?:\/\//, '')}
                  <span className="text-xs">↗</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed content */}
        <WorkshopTabs
          listings={listings as never}
          reviews={reviews}
          slug={slug}
          isOwnProfile={isOwnProfile}
          viewerWorkshopId={profile.workshop_id}
        />
      </main>
    </div>
  )
}
