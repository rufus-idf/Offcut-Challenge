'use client'

import { useState } from 'react'

type Props = {
  initialMinQty?: number | null
  initialPct?: number | null
}

export function DiscountFields({ initialMinQty, initialPct }: Props) {
  const [enabled, setEnabled] = useState(!!(initialMinQty && initialPct))
  const [minQty, setMinQty] = useState(initialMinQty ?? 5)
  const [pct, setPct]       = useState(initialPct    ?? 10)

  const valid = enabled && minQty >= 2 && pct >= 1

  return (
    <div className="border-t border-stone-100 pt-5">
      {/* Toggle row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-700">Quantity discount</p>
          <p className="mt-0.5 text-xs text-stone-400">
            Optional — offer a lower price per piece for larger orders
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(e => !e)}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-[#3DBE72]' : 'bg-stone-200'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : ''}`}
          />
        </button>
      </div>

      {/* Hidden values — always submitted so the action can clear them when disabled */}
      <input type="hidden" name="discount_enabled" value={enabled ? '1' : '0'} />

      {enabled && (
        <div className="mt-4 space-y-3">
          {/* Inputs */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            <span>Buy at least</span>
            <input
              type="number"
              name="discount_min_qty"
              min={2} max={9999} step={1}
              value={minQty}
              onChange={e => setMinQty(Math.max(2, parseInt(e.target.value) || 2))}
              className="w-20 rounded-lg border border-stone-300 px-3 py-1.5 text-center text-sm outline-none focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20"
            />
            <span>pieces and get</span>
            <div className="relative">
              <input
                type="number"
                name="discount_pct"
                min={1} max={80} step={1}
                value={pct}
                onChange={e => setPct(Math.min(80, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 rounded-lg border border-stone-300 py-1.5 pl-3 pr-7 text-center text-sm outline-none focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-stone-400">%</span>
            </div>
            <span>off per piece</span>
          </div>

          {/* Live preview */}
          {valid && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs">
              <span className="text-amber-600">🏷</span>
              <span className="font-medium text-amber-800">
                Buy {minQty}+ pieces and save {pct}% per piece
              </span>
              <span className="ml-auto text-amber-600">shown on listing</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
