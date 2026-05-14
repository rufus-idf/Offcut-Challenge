'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { StarRating } from '@/components/star-rating'

export type SummaryData = {
  // Current state — always reflects now, regardless of period
  currentAvailable:   number
  currentListed:      number
  currentSold:        number
  currentArchived:    number
  activeListings:     number
  avgRating:          number | null
  totalReviews:       number
  byCategory:         { category: string; count: number }[]
  // Activity within selected period
  addedInPeriod:      number
  publishedInPeriod:  number
  reviewsInPeriod:    number
  // Meta
  period:             string
  memberSince:        string
}

const PERIODS = [
  { value: '30d',  label: '30 days' },
  { value: '90d',  label: '90 days' },
  { value: '12m',  label: '12 months' },
  { value: 'all',  label: 'All time' },
]

const SECTIONS = [
  { key: 'snapshot',   label: 'Current snapshot' },
  { key: 'activity',   label: 'Activity' },
  { key: 'categories', label: 'By category' },
]

const PERIOD_LABELS: Record<string, string> = {
  '30d': 'last 30 days',
  '90d': 'last 90 days',
  '12m': 'last 12 months',
  'all': 'all time',
}

function StatCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-black tracking-tight text-stone-900" style={{ letterSpacing: '-0.03em' }}>
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-stone-600">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
    </div>
  )
}

export function AccountSummary(props: SummaryData) {
  const router   = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [visible, setVisible] = useState<Set<string>>(new Set(['snapshot', 'activity', 'categories']))

  const setPeriod = (p: string) => {
    startTransition(() => router.push(`${pathname}?period=${p}`))
  }

  const toggleSection = (key: string) => {
    setVisible(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const totalCurrentStock = props.currentAvailable + props.currentListed + props.currentSold + props.currentArchived
  const maxCategory = Math.max(...props.byCategory.map(c => c.count), 1)

  return (
    <div className="mt-8 rounded-xl border border-stone-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-stone-900">Account Summary</h2>
          <p className="mt-0.5 text-xs text-stone-400">Member since {props.memberSince} · private view</p>
        </div>
        {/* Period tabs */}
        <div className="flex overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
          {PERIODS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`px-3.5 py-1.5 text-sm font-medium transition-colors ${
                props.period === p.value
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section toggles */}
      <div className="flex items-center gap-2 border-b border-stone-100 px-6 py-3">
        <span className="text-xs text-stone-400 mr-1">Show:</span>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => toggleSection(s.key)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              visible.has(s.key)
                ? 'border-[#3DBE72] bg-[#E8F7EE] text-[#2A9E5A]'
                : 'border-stone-200 bg-white text-stone-400 hover:text-stone-600'
            }`}
          >
            {visible.has(s.key) && <span className="h-1.5 w-1.5 rounded-full bg-[#3DBE72]" />}
            {s.label}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-8">

        {/* ── Current snapshot ── */}
        {visible.has('snapshot') && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Current snapshot
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard value={props.currentAvailable} label="In stock"         sub="available items" />
              <StatCard value={props.currentListed}    label="Listed"           sub="on marketplace" />
              <StatCard value={props.currentSold}      label="Sold"             sub="lifetime total" />
              <StatCard value={props.activeListings}   label="Active listings"  sub="visible to buyers" />
              <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                {props.avgRating !== null ? (
                  <>
                    <p className="text-3xl font-black tracking-tight text-stone-900" style={{ letterSpacing: '-0.03em' }}>
                      {props.avgRating.toFixed(1)}
                    </p>
                    <div className="mt-1.5">
                      <StarRating rating={props.avgRating} size="sm" />
                    </div>
                    <p className="mt-1 text-xs text-stone-400">{props.totalReviews} review{props.totalReviews !== 1 ? 's' : ''}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-black tracking-tight text-stone-300">—</p>
                    <p className="mt-1 text-sm font-medium text-stone-600">Rating</p>
                    <p className="mt-0.5 text-xs text-stone-400">No reviews yet</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Activity in period ── */}
        {visible.has('activity') && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Activity — {PERIOD_LABELS[props.period]}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard
                value={props.addedInPeriod}
                label="Items added to stock"
                sub={props.period === 'all' ? 'all time' : `in ${PERIOD_LABELS[props.period]}`}
              />
              <StatCard
                value={props.publishedInPeriod}
                label="Listings published"
                sub="pushed to marketplace"
              />
              <StatCard
                value={props.reviewsInPeriod}
                label="Reviews received"
                sub={props.period === 'all' ? 'all time' : `in ${PERIOD_LABELS[props.period]}`}
              />
            </div>
          </div>
        )}

        {/* ── Category breakdown ── */}
        {visible.has('categories') && props.byCategory.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Stock by category — {totalCurrentStock} item{totalCurrentStock !== 1 ? 's' : ''} total
            </p>
            <div className="space-y-3">
              {props.byCategory.map(({ category, count }) => {
                const pct = Math.round((count / totalCurrentStock) * 100)
                const barPct = Math.round((count / maxCategory) * 100)
                return (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-stone-700">{category}</span>
                      <span className="text-stone-400">{count} item{count !== 1 ? 's' : ''} · {pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-[#3DBE72] transition-all duration-500"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {totalCurrentStock === 0 && props.addedInPeriod === 0 && (
          <p className="text-center text-sm text-stone-400 py-4">
            No stock data yet — add items to your stock to see your summary.
          </p>
        )}

      </div>
    </div>
  )
}
