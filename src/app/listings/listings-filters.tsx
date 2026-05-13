'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useTransition, useRef, useState, useEffect } from 'react'
import { CATEGORIES, ALL_MATERIALS, ALL_FINISHES } from '@/lib/constants'

const shimmerStyle = (color: string, dimColor: string): React.CSSProperties => ({
  background: `linear-gradient(90deg, ${dimColor} 0%, ${color} 50%, ${dimColor} 100%)`,
  backgroundSize: '300% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: 'text-shimmer 1.6s ease-in-out infinite',
})

type Filters = {
  q?: string
  category?: string
  material?: string
  finish?: string
  max_price?: string
  sort?: string
  postcode?: string
  hide_own?: string
  min_length?: string
  max_length?: string
  min_width?: string
  max_width?: string
  min_thickness?: string
  max_thickness?: string
  view?: string
}

type SizeLocal = {
  min_length: string; max_length: string
  min_width: string;  max_width: string
  min_thickness: string; max_thickness: string
}

const selectCls = 'rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none transition-colors focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20 hover:border-stone-300 cursor-pointer'

const SIZE_ROWS: { label: string; minKey: keyof SizeLocal; maxKey: keyof SizeLocal }[] = [
  { label: 'Length',    minKey: 'min_length',    maxKey: 'max_length' },
  { label: 'Width',     minKey: 'min_width',     maxKey: 'max_width' },
  { label: 'Thickness', minKey: 'min_thickness', maxKey: 'max_thickness' },
]

// View density options
const VIEW_OPTIONS = [
  {
    value: 'grid',
    label: 'Grid',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
        <rect x="1" y="1" width="6" height="6" rx="1"/>
        <rect x="9" y="1" width="6" height="6" rx="1"/>
        <rect x="1" y="9" width="6" height="6" rx="1"/>
        <rect x="9" y="9" width="6" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    value: 'wide',
    label: 'Compact',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 16">
        <rect x="0" y="1" width="4" height="6" rx="1"/>
        <rect x="5.3" y="1" width="4" height="6" rx="1"/>
        <rect x="10.7" y="1" width="4" height="6" rx="1"/>
        <rect x="16" y="1" width="4" height="6" rx="1"/>
        <rect x="0" y="9" width="4" height="6" rx="1"/>
        <rect x="5.3" y="9" width="4" height="6" rx="1"/>
        <rect x="10.7" y="9" width="4" height="6" rx="1"/>
        <rect x="16" y="9" width="4" height="6" rx="1"/>
      </svg>
    ),
  },
  {
    value: 'list',
    label: 'List',
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
        <rect x="1" y="1.5" width="14" height="3" rx="1"/>
        <rect x="1" y="6.5" width="14" height="3" rx="1"/>
        <rect x="1" y="11.5" width="14" height="3" rx="1"/>
      </svg>
    ),
  },
]

export function ListingsFilters({ filters }: { filters: Filters }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const filtersRef  = useRef(filters)
  useEffect(() => { filtersRef.current = filters }, [filters])

  const [search,   setSearch]   = useState(filters.q        ?? '')
  const [postcode, setPostcode] = useState(filters.postcode ?? '')
  useEffect(() => { setSearch(filters.q ?? '') },         [filters.q])
  useEffect(() => { setPostcode(filters.postcode ?? '') }, [filters.postcode])

  // Size popover
  const [sizeOpen, setSizeOpen] = useState(false)
  const sizeRef   = useRef<HTMLDivElement>(null)
  const emptySize: SizeLocal = { min_length: '', max_length: '', min_width: '', max_width: '', min_thickness: '', max_thickness: '' }
  const [localSize, setLocalSize] = useState<SizeLocal>({
    min_length:    filters.min_length    ?? '',
    max_length:    filters.max_length    ?? '',
    min_width:     filters.min_width     ?? '',
    max_width:     filters.max_width     ?? '',
    min_thickness: filters.min_thickness ?? '',
    max_thickness: filters.max_thickness ?? '',
  })

  useEffect(() => {
    setLocalSize({
      min_length: filters.min_length ?? '', max_length: filters.max_length ?? '',
      min_width:  filters.min_width  ?? '', max_width:  filters.max_width  ?? '',
      min_thickness: filters.min_thickness ?? '', max_thickness: filters.max_thickness ?? '',
    })
  }, [filters.min_length, filters.max_length, filters.min_width, filters.max_width, filters.min_thickness, filters.max_thickness])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (sizeRef.current && !sizeRef.current.contains(e.target as Node)) setSizeOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const hasSizeFilter = !!(filters.min_length || filters.max_length || filters.min_width || filters.max_width || filters.min_thickness || filters.max_thickness)
  const hasFilters    = !!(filters.q || filters.category || filters.material || filters.finish || filters.max_price || filters.sort || filters.postcode || filters.hide_own || hasSizeFilter)
  const activeView    = filters.view ?? 'grid'

  const navigate = useCallback((updates: Partial<Filters>) => {
    const merged = { ...filtersRef.current, ...updates }
    const sp = new URLSearchParams()
    if (merged.q)             sp.set('q',             merged.q)
    if (merged.category)      sp.set('category',      merged.category)
    if (merged.material)      sp.set('material',      merged.material)
    if (merged.finish)        sp.set('finish',        merged.finish)
    if (merged.max_price)     sp.set('max_price',     merged.max_price)
    if (merged.sort)          sp.set('sort',          merged.sort)
    if (merged.postcode)      sp.set('postcode',      merged.postcode)
    if (merged.hide_own)      sp.set('hide_own',      merged.hide_own)
    if (merged.min_length)    sp.set('min_length',    merged.min_length)
    if (merged.max_length)    sp.set('max_length',    merged.max_length)
    if (merged.min_width)     sp.set('min_width',     merged.min_width)
    if (merged.max_width)     sp.set('max_width',     merged.max_width)
    if (merged.min_thickness) sp.set('min_thickness', merged.min_thickness)
    if (merged.max_thickness) sp.set('max_thickness', merged.max_thickness)
    if (merged.view && merged.view !== 'grid') sp.set('view', merged.view)
    startTransition(() => { router.push(`${pathname}?${sp.toString()}`) })
  }, [router, pathname])

  const set         = (key: keyof Filters, value: string) => navigate({ [key]: value || undefined })
  const setDebounced = (key: keyof Filters, value: string) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate({ [key]: value || undefined }), 450)
  }

  const applySize = () => {
    navigate({
      min_length: localSize.min_length || undefined, max_length: localSize.max_length || undefined,
      min_width:  localSize.min_width  || undefined, max_width:  localSize.max_width  || undefined,
      min_thickness: localSize.min_thickness || undefined, max_thickness: localSize.max_thickness || undefined,
    })
    setSizeOpen(false)
  }

  const clearSize = () => {
    setLocalSize(emptySize)
    navigate({ min_length: undefined, max_length: undefined, min_width: undefined, max_width: undefined, min_thickness: undefined, max_thickness: undefined })
    setSizeOpen(false)
  }

  const clearAll = () => {
    setSearch(''); setPostcode(''); setLocalSize(emptySize)
    startTransition(() => router.push(pathname))
  }

  return (
    <div className="mb-8">
      {/* Loading overlay — covers programmatic filter navigation (router.push) */}
      {isPending && (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{ background: 'rgba(28,28,30,0.70)' }}
        >
          <p className="select-none text-4xl font-black" style={{ letterSpacing: '-0.03em' }}>
            <span style={shimmerStyle('#ffffff', 'rgba(255,255,255,0.25)')}>Offcut</span>
            <span style={shimmerStyle('#3DBE72', 'rgba(61,190,114,0.25)')}>Challenge</span>
          </p>
        </div>
      )}

      <div className={`transition-opacity duration-150 ${isPending ? 'pointer-events-none opacity-50' : ''}`}>
        {/* Search */}
        <div className="relative mb-4">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <button type="button" onClick={() => { setSearch(''); set('q', '') }} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-700" aria-label="Clear search">✕</button>
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

          {/* Size */}
          <div className="relative" ref={sizeRef}>
            <button
              type="button"
              onClick={() => setSizeOpen(o => !o)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors ${hasSizeFilter ? 'border-[#3DBE72] bg-[#E8F7EE] font-medium text-[#2A9E5A]' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'}`}
            >
              Size {hasSizeFilter && <span className="h-1.5 w-1.5 rounded-full bg-[#3DBE72]" />}
              <svg className={`h-3.5 w-3.5 transition-transform ${sizeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {sizeOpen && (
              <div className="absolute top-full left-0 z-20 mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Size (mm)</p>
                {SIZE_ROWS.map(({ label, minKey, maxKey }) => (
                  <div key={label} className="mb-3 last:mb-0">
                    <p className="mb-1.5 text-xs text-stone-500">{label}</p>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" step="1" placeholder="Min" value={localSize[minKey]} onChange={e => setLocalSize(s => ({ ...s, [minKey]: e.target.value }))} className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm text-stone-700 outline-none focus:border-[#3DBE72] focus:ring-1 focus:ring-[#3DBE72]/20" />
                      <span className="shrink-0 text-stone-300">–</span>
                      <input type="number" min="0" step="1" placeholder="Max" value={localSize[maxKey]} onChange={e => setLocalSize(s => ({ ...s, [maxKey]: e.target.value }))} className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-sm text-stone-700 outline-none focus:border-[#3DBE72] focus:ring-1 focus:ring-[#3DBE72]/20" />
                    </div>
                  </div>
                ))}
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={clearSize} className="flex-1 rounded-lg border border-stone-200 py-1.5 text-sm text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700">Clear</button>
                  <button type="button" onClick={applySize} className="flex-1 rounded-lg bg-[#3DBE72] py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A9E5A]">Apply</button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">£</span>
            <input type="number" min="0" step="0.01" placeholder="Max price" value={filters.max_price ?? ''} onChange={e => setDebounced('max_price', e.target.value)} className={`${selectCls} w-32 pl-7`} />
          </div>

          <select value={filters.sort ?? ''} onChange={e => set('sort', e.target.value)} className={selectCls}>
            <option value="">Newest first</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
          </select>

          <input type="text" placeholder="Postcode (nearest first)" value={postcode} onChange={e => { setPostcode(e.target.value); setDebounced('postcode', e.target.value) }} className={`${selectCls} w-44`} />

          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={filters.hide_own === '1'} onChange={e => set('hide_own', e.target.checked ? '1' : '')} className="h-4 w-4 rounded border-stone-300 accent-[#3DBE72]" />
            <span className="text-sm text-stone-600 select-none">Hide mine</span>
          </label>

          {hasFilters && (
            <button type="button" onClick={clearAll} className="ml-auto flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700">
              Clear all <span className="text-stone-400">×</span>
            </button>
          )}

          {/* View density toggle — always rightmost */}
          <div className="ml-auto flex overflow-hidden rounded-xl border border-stone-200 bg-white">
            {VIEW_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                onClick={() => set('view', opt.value)}
                className={`px-3 py-2 transition-colors ${
                  activeView === opt.value
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-400 hover:bg-stone-50 hover:text-stone-700'
                }`}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
