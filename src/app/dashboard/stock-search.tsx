'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef, useState, useTransition, useEffect } from 'react'

export function StockSearch({ initialValue, activeFilter }: { initialValue: string; activeFilter: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(initialValue)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [, startTransition] = useTransition()

  useEffect(() => { setSearch(initialValue) }, [initialValue])

  const navigate = (q: string) => {
    const sp = new URLSearchParams()
    if (activeFilter && activeFilter !== 'all') sp.set('filter', activeFilter)
    if (q.trim()) sp.set('q', q.trim())
    startTransition(() => router.push(`${pathname}${sp.toString() ? `?${sp}` : ''}`))
  }

  return (
    <div className="relative mb-4">
      <svg
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        type="text"
        placeholder="Search your stock by material, finish or description…"
        value={search}
        onChange={e => {
          setSearch(e.target.value)
          clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => navigate(e.target.value), 400)
        }}
        className="w-full rounded-full border border-stone-200 bg-white py-2.5 pl-11 pr-10 text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20"
      />
      {search && (
        <button
          type="button"
          onClick={() => { setSearch(''); navigate('') }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-700"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  )
}
