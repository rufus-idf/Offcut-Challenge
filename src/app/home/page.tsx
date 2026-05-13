export const metadata = { title: 'Home' }

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'

type WorkshopInfo = {
  name: string
  slug: string
  verification_status: string
}

export default async function AppHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name, slug, verification_status)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const workshop = profile.workshops as unknown as WorkshopInfo | null
  const workshopName = workshop?.name ?? 'Your Workshop'
  const isVerified = workshop?.verification_status === 'approved'

  const [{ data: stockRows }, { count: marketplaceCount }] = await Promise.all([
    supabase
      .from('stock_items')
      .select('status')
      .eq('workshop_id', profile.workshop_id),
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const counts = (stockRows ?? []).reduce((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const availableCount  = counts.available ?? 0
  const listedCount     = counts.listed    ?? 0
  const soldCount       = counts.sold      ?? 0
  const totalStockCount = (stockRows ?? []).length

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={workshopName} />

      {/* Hero — matches website gradient */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0E1A10 0%, #1A2E1E 45%, #17241A 100%)' }}
      >
        {/* Subtle crosshatch overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(108deg, transparent 0, transparent 8px, rgba(255,255,255,0.012) 8px, rgba(255,255,255,0.012) 9px), ' +
              'repeating-linear-gradient(98deg, transparent 0, transparent 24px, rgba(255,255,255,0.007) 24px, rgba(255,255,255,0.007) 25px)',
          }}
        />
        {/* Fade to page background */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-28"
          style={{ background: 'linear-gradient(to bottom, transparent, #FAF9F7)' }}
        />

        <div className="relative px-8 py-16 pb-32">
          {/* Badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
            style={{
              background: 'rgba(61,190,114,0.18)',
              border: '1px solid rgba(61,190,114,0.30)',
              color: '#3DBE72',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#3DBE72]" />
            Offcut Challenge
          </div>

          <h1 className="mb-3 text-4xl font-black tracking-tight text-white sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
            Welcome back,{' '}
            <span className="text-[#3DBE72]">{workshopName}</span>.
          </h1>
          <p className="mb-10 max-w-lg text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
            Your central hub for managing offcut stock, browsing the marketplace, and connecting with UK workshops.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { val: availableCount,  label: 'in stock' },
              { val: listedCount,     label: 'listed' },
              { val: soldCount,       label: 'sold' },
            ].map(({ val, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <span className="font-bold text-white">{val}</span>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{label}</span>
              </div>
            ))}
            {(marketplaceCount ?? 0) > 0 && (
              <div
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                style={{ background: 'rgba(61,190,114,0.15)', border: '1px solid rgba(61,190,114,0.25)' }}
              >
                <span className="font-bold text-[#3DBE72]">{marketplaceCount}</span>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>marketplace listings</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards + actions */}
      <main className="relative z-10 px-8 pb-16 -mt-10">

        {/* Verification notice */}
        {!isVerified && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-amber-800">Verification pending</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {workshop?.verification_status === 'unverified'
                  ? 'Submit your Companies House number to get verified and access the full marketplace.'
                  : 'Your verification is being reviewed. We\'ll email you once approved.'}
              </p>
            </div>
            {workshop?.verification_status === 'unverified' && (
              <Link
                href="/verification"
                className="shrink-0 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
              >
                Verify now →
              </Link>
            )}
          </div>
        )}

        {/* Nav cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* My Stock */}
          <Link
            href="/dashboard"
            className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#3DBE72]/40 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7EE]">
              <svg className="h-5 w-5 text-[#2A9E5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="mb-1.5 font-bold text-stone-900 transition-colors group-hover:text-[#2A9E5A]">My Stock</h2>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-stone-500">
              Manage your full inventory — available pieces, active listings, and sold items.
            </p>
            <p className="text-xs font-semibold text-[#2A9E5A]">
              {totalStockCount} item{totalStockCount !== 1 ? 's' : ''} total
            </p>
            <p className="mt-3 text-xs text-stone-400 transition-colors group-hover:text-[#3DBE72]">Open →</p>
          </Link>

          {/* Browse Listings */}
          <Link
            href="/listings"
            className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#3DBE72]/40 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7EE]">
              <svg className="h-5 w-5 text-[#2A9E5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="mb-1.5 font-bold text-stone-900 transition-colors group-hover:text-[#2A9E5A]">Browse Listings</h2>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-stone-500">
              Find offcuts from verified workshops across the UK, filtered by size, material and location.
            </p>
            {(marketplaceCount ?? 0) > 0 && (
              <p className="text-xs font-semibold text-[#2A9E5A]">
                {marketplaceCount} active listing{marketplaceCount !== 1 ? 's' : ''}
              </p>
            )}
            <p className="mt-3 text-xs text-stone-400 transition-colors group-hover:text-[#3DBE72]">Browse →</p>
          </Link>

          {/* Workshop Map */}
          <Link
            href="/workshops"
            className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#3DBE72]/40 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F7EE]">
              <svg className="h-5 w-5 text-[#2A9E5A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className="mb-1.5 font-bold text-stone-900 transition-colors group-hover:text-[#2A9E5A]">Workshop Map</h2>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-stone-500">
              Explore verified UK workshops on the map and browse their available stock.
            </p>
            <p className="mt-auto text-xs text-stone-400 transition-colors group-hover:text-[#3DBE72]">Open map →</p>
          </Link>

          {/* Camera */}
          <Link
            href="/camera"
            className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-stone-300 hover:shadow-md"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-stone-100">
              <svg className="h-5 w-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="mb-1.5 font-bold text-stone-900 transition-colors group-hover:text-stone-700">Camera</h2>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-stone-500">
              Connect your scanner to automatically measure and add offcuts to your stock.
            </p>
            <p className="mt-auto text-xs text-stone-400 transition-colors group-hover:text-stone-600">Set up →</p>
          </Link>

        </div>

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/listings/new"
            className="flex items-center gap-2 rounded-full bg-[#3DBE72] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2A9E5A]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add item to stock
          </Link>

          {isVerified && workshop?.slug && (
            <Link
              href={`/workshops/${workshop.slug}`}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-[#3DBE72]/40 hover:text-[#2A9E5A]"
            >
              View my workshop profile →
            </Link>
          )}

          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-800"
          >
            Settings
          </Link>
        </div>

      </main>
    </div>
  )
}
