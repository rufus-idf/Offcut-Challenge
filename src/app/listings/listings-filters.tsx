'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useTransition, useRef, useState, useEffect } from 'react'
import { CATEGORIES, ALL_MATERIALS, ALL_FINISHES } from '@/lib/constants'

type Filters = {
  q?: string
  category?: string
  material?: string
  finish?: string
  max_price?: string
  sort?: string
  town?: string
  postcode?: string
  hide_own?: string
}

const selectCls = 'rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition-colors focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20 hover:border-stone-300 cursor-pointer'

export function ListingsFilters({
  towns,
  filters,
}: {
  towns: string[]
  filters: Filters
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const filtersRef = useRef(filters)
  useEffect(() => { filtersRef.current = filters }, [filters])

  const [search, setSearch] = useState(filters.q ?? '')
  const [postcode, setPostcode] = useState(filters.postcode ?? '')
  useEffect(() => { setSearch(filters.q ?? '') }, [filters.q])
  useEffect(() => { setPostcode(filters.postcode ?? '') }, [filters.postcode])

  const hasFilters = !!(
    filters.q || filters.category || filters.material || filters.finish ||
    filters.max_price || filters.sort || filters.town || filters.postcode || filters.hide_own
  )

  const navigate = useCallback((updates: Partial<Filters>) => {
    const merged = { ...filtersRef.current, ...updates }
    const sp = new URLSearchParams()
    if (merged.q)         sp.set('q', merged.q)
    if (merged.category)  sp.set('category', merged.category)
    if (merged.material)  sp.set('material', merged.material)
    if (merged.finish)    sp.set('finish', merged.finish)
    if (merged.max_price) sp.set('max_price', merged.max_price)
    if (merged.sort)      sp.set('sort', merged.sort)
    if (merged.town)      sp.set('town', merged.town)
    if (merged.postcode)  sp.set('postcode', merged.postcode)
    if (merged.hide_own)  sp.set('hide_own', merged.hide_own)
    startTransition(() => { router.push(`${pathname}?${sp.toString()}`) })
  }, [router, pathname])

  const set = (key: keyof Filters, value: string) =>
    navigate({ [key]: value || undefined })

  const setDebounced = (key: keyof Filters, value: string) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate({ [key]: value || undefined }), 450)
  }

  const clearAll = () => {
    setSearch('')
    setPostcode('')
    startTransition(() => router.push(pathname))
  }

  return (
    <div className={`mb-8 transition-opacity duration-150 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>

      {/* Search — prominent pill */}
      <div className="relative mb-4">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search materials, workshops, finishes…"
          value={search}
          onChange={e => { setSearch(e.target.value); setDebounced('q', e.target.value) }}
          className="w-full rounded-full border border-stone-200 bg-white py-3 pl-11 pr-10 text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20"
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); set('q', '') }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-700"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter strip */}
      <div className="flex flex-wrap items-center gap-2">

        <select value={filters.category ?? ''} onChange={e => set('category', e.target.value)} className={selectCls}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filters.material ?? ''} onChange={e => set('material', e.target.value)} className={selectCls}>
          <option value="">All materials</option>
          {ALL_MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filters.finish ?? ''} onChange={e => set('finish', e.target.value)} className={selectCls}>
          <option value="">All finishes</option>
          {ALL_FINISHES.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">£</span>
          <input
            type="number" min="0" step="0.01"
            placeholder="Max price"
            value={filters.max_price ?? ''}
            onChange={e => setDebounced('max_price', e.target.value)}
            className={`${selectCls} w-32 pl-7`}
          />
        </div>

        <select value={filters.sort ?? ''} onChange={e => set('sort', e.target.value)} className={selectCls}>
          <option value="">Newest first</option>
          <option value="price_asc">Price: low → high</option>
          <option value="price_desc">Price: high → low</option>
        </select>

        {towns.length > 0 && (
          <select value={filters.town ?? ''} onChange={e => set('town', e.target.value)} className={selectCls}>
            <option value="">All locations</option>
            {towns.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}

        <input
          type="text"
          placeholder="Postcode (nearest first)"
          value={postcode}
          onChange={e => { setPostcode(e.target.value); setDebounced('postcode', e.target.value) }}
          className={`${selectCls} w-44`}
        />

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={filters.hide_own === '1'}
            onChange={e => set('hide_own', e.target.checked ? '1' : '')}
            className="h-4 w-4 rounded border-stone-300 accent-[#3DBE72]"
          />
          <span className="text-sm text-stone-600 select-none">Hide mine</span>
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-2 flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700"
          >
            Clear all <span className="text-stone-400">×</span>
          </button>
        )}

      </div>
    </div>
  )
}
