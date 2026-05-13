'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { WorkshopMapLoader } from '@/components/workshop-map-loader'

type Workshop = {
  id: string
  name: string
  slug: string
  town: string | null
  county: string | null
  lat: number | null
  lng: number | null
}

export function WorkshopsClient({ workshops }: { workshops: Workshop[] }) {
  const [search, setSearch] = useState('')
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const query = search.trim().toLowerCase()
  const suggestions = query.length >= 1
    ? workshops.filter(w => w.name.toLowerCase().includes(query)).slice(0, 8)
    : []

  // Only pass workshops that have coordinates to the map
  const mappableWorkshops = workshops.filter(
    (w): w is Workshop & { lat: number; lng: number } => w.lat != null && w.lng != null
  )

  const handleSelect = (w: Workshop) => {
    setFocusedId(w.id)
    setSearch(w.name)
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    setSearch('')
    setFocusedId(null)
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Search */}
      <div className="relative mb-5">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for a workshop by name…"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full rounded-full border border-stone-200 bg-white py-3 pl-11 pr-10 text-sm text-stone-800 outline-none transition-all placeholder:text-stone-400 focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20"
        />
        {search && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); handleClear() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors hover:text-stone-700"
            aria-label="Clear"
          >
            ✕
          </button>
        )}

        {/* Dropdown */}
        {open && suggestions.length > 0 && (
          <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg">
            {suggestions.map(w => (
              <button
                key={w.id}
                type="button"
                onMouseDown={() => handleSelect(w)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#E8F7EE]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8F7EE]">
                  <span className="text-xs font-bold text-[#2A9E5A]">
                    {w.name.charAt(0).toUpperCase()}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">{w.name}</p>
                  {w.town && (
                    <p className="text-xs text-stone-400">{[w.town, w.county].filter(Boolean).join(', ')}</p>
                  )}
                </div>
                {w.lat && (
                  <span className="ml-auto shrink-0 text-xs text-[#3DBE72]">Show on map →</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
        style={{ height: '480px' }}
      >
        <WorkshopMapLoader workshops={mappableWorkshops} focusedId={focusedId} />
      </div>

      {/* Workshop list */}
      <div className="mt-10">
        <h2 className="mb-5 text-lg font-semibold text-stone-900">
          All verified workshops
          <span className="ml-2 text-base font-normal text-stone-400">({workshops.length})</span>
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map(w => (
            <Link
              key={w.id}
              href={`/workshops/${w.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#3DBE72]/40 hover:shadow-md"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F7EE]">
                <span className="text-sm font-bold text-[#2A9E5A]">
                  {w.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-stone-900 transition-colors group-hover:text-[#2A9E5A]">
                  {w.name}
                </p>
                {w.town ? (
                  <p className="mt-0.5 text-xs text-stone-400">
                    {[w.town, w.county].filter(Boolean).join(', ')}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-stone-300">Location not set</p>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="rounded-full bg-[#E8F7EE] px-2.5 py-0.5 text-xs font-semibold text-[#1C7040]">
                  Verified
                </span>
                <span className="text-xs text-stone-400 transition-colors group-hover:text-[#3DBE72]">
                  View →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
