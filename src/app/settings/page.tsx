export const metadata = { title: 'Workshop Settings' }

import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { getLogoUrl } from '@/lib/format'
import { updateWebsiteUrl, uploadLogo, removeLogo } from './actions'
import { SubmitButton } from '@/components/submit-button'
import { AccountSummary } from './account-summary'
import type { SummaryData } from './account-summary'

const inputClass = 'rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20'

function getFromDate(period: string): string | null {
  const now = Date.now()
  if (period === '30d') return new Date(now - 30  * 86_400_000).toISOString()
  if (period === '90d') return new Date(now - 90  * 86_400_000).toISOString()
  if (period === '12m') return new Date(now - 365 * 86_400_000).toISOString()
  return null // 'all'
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; period?: string }>
}) {
  const { message, error, period: rawPeriod } = await searchParams
  const period = ['30d', '90d', '12m', 'all'].includes(rawPeriod ?? '') ? rawPeriod! : 'all'
  const fromDate = getFromDate(period)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(id, name, slug, logo_url, website_url, verification_status, created_at)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const workshop = profile.workshops as unknown as {
    id: string
    name: string
    slug: string
    logo_url: string | null
    website_url: string | null
    verification_status: string
    created_at: string
  } | null

  if (!workshop) redirect('/onboarding')

  // ── Summary data ──────────────────────────────────────────────────────────

  // Current state (no date filter — reflects now)
  const [
    { data: allStock },
    { data: allListings },
    { data: allReviews },
  ] = await Promise.all([
    supabase.from('stock_items').select('status, category').eq('workshop_id', workshop.id),
    supabase.from('listings').select('status').eq('workshop_id', workshop.id),
    supabase.from('reviews').select('rating').eq('reviewed_workshop_id', workshop.id),
  ])

  // Period-filtered activity
  let stockInPeriodQuery = supabase
    .from('stock_items').select('id').eq('workshop_id', workshop.id)
  let listingsInPeriodQuery = supabase
    .from('listings').select('id').eq('workshop_id', workshop.id)
  let reviewsInPeriodQuery = supabase
    .from('reviews').select('id').eq('reviewed_workshop_id', workshop.id)

  if (fromDate) {
    stockInPeriodQuery    = stockInPeriodQuery.gte('created_at', fromDate)
    listingsInPeriodQuery = listingsInPeriodQuery.gte('created_at', fromDate)
    reviewsInPeriodQuery  = reviewsInPeriodQuery.gte('created_at', fromDate)
  }

  const [
    { count: addedInPeriod },
    { count: publishedInPeriod },
    { count: reviewsInPeriod },
  ] = await Promise.all([
    stockInPeriodQuery.select('id',    { count: 'exact', head: true }),
    listingsInPeriodQuery.select('id', { count: 'exact', head: true }),
    reviewsInPeriodQuery.select('id',  { count: 'exact', head: true }),
  ])

  // Compute stats
  const stock    = allStock    ?? []
  const listings = allListings ?? []
  const reviews  = allReviews  ?? []

  const currentAvailable = stock.filter(s => s.status === 'available').length
  const currentListed    = stock.filter(s => s.status === 'listed').length
  const currentSold      = stock.filter(s => s.status === 'sold').length
  const currentArchived  = stock.filter(s => s.status === 'archived').length
  const activeListings   = listings.filter(l => l.status === 'active').length
  const avgRating        = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  // Category breakdown — sorted descending by count
  const catMap = stock.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1
    return acc
  }, {})
  const byCategory = Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const summaryData: SummaryData = {
    currentAvailable,
    currentListed,
    currentSold,
    currentArchived,
    activeListings,
    avgRating,
    totalReviews:     reviews.length,
    byCategory,
    addedInPeriod:    addedInPeriod    ?? 0,
    publishedInPeriod: publishedInPeriod ?? 0,
    reviewsInPeriod:  reviewsInPeriod  ?? 0,
    period,
    memberSince:      new Date(workshop.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  }

  // ── Action bindings ───────────────────────────────────────────────────────
  const websiteAction = updateWebsiteUrl.bind(null, workshop.id)
  const logoAction    = uploadLogo.bind(null, workshop.id)
  const removeAction  = removeLogo.bind(null, workshop.id)

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={workshop.name} />

      <main className="px-8 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Workshop settings</h1>
          <p className="mt-1 text-sm text-stone-500">{workshop.name}</p>
        </div>

        {message && (
          <div className="mb-6 max-w-2xl rounded-xl border border-green-200 bg-green-50 px-5 py-3">
            <p className="text-sm text-green-800">{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-5 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Logo + website — narrow, form layout */}
        <div className="max-w-2xl space-y-6">

          {/* Logo */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-stone-900">Workshop logo</h2>

            {workshop.logo_url ? (
              <div className="mb-4 flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                  <Image
                    src={getLogoUrl(workshop.logo_url)}
                    alt={`${workshop.name} logo`}
                    fill
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-700">Current logo</p>
                  <form action={removeAction} className="mt-1">
                    <button type="submit" className="text-xs text-red-600 hover:text-red-800">Remove logo</button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50">
                <p className="text-xs text-stone-400">No logo</p>
              </div>
            )}

            <form action={logoAction} encType="multipart/form-data" className="flex flex-col gap-3">
              <div className="flex gap-3">
                <input
                  type="file"
                  name="logo"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  required
                  className="flex-1 text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
                />
                <SubmitButton pendingText="Uploading…" className="rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A9E5A] disabled:opacity-60">
                  Upload
                </SubmitButton>
              </div>
              <p className="text-xs text-stone-400">JPEG, PNG, WebP or SVG · max 2MB · square images work best</p>
            </form>
          </div>

          {/* Website */}
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-stone-900">Website</h2>
            <form action={websiteAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="website_url" className="text-sm font-medium text-stone-700">Your workshop website</label>
                <input
                  id="website_url"
                  name="website_url"
                  type="url"
                  placeholder="https://yourworkshop.co.uk"
                  defaultValue={workshop.website_url ?? ''}
                  className={inputClass}
                />
                <p className="text-xs text-stone-400">Shown on your public profile so other workshops can find you.</p>
              </div>
              <div>
                <SubmitButton pendingText="Saving…" className="rounded-lg bg-[#3DBE72] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2A9E5A] disabled:opacity-60">
                  Save
                </SubmitButton>
              </div>
            </form>
          </div>

          {workshop.verification_status === 'approved' && (
            <p className="text-center text-xs text-stone-400">
              Your public profile:{' '}
              <a href={`/workshops/${workshop.slug}`} className="text-[#2A9E5A] hover:underline">
                /workshops/{workshop.slug}
              </a>
            </p>
          )}
        </div>

        {/* Account Summary — full width */}
        <AccountSummary {...summaryData} />

      </main>
    </div>
  )
}
