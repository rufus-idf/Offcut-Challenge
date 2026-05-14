'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/format'
import { enquireListing } from '@/app/listings/[id]/actions'
import { SubmitButton } from '@/components/submit-button'

export function QuantityEnquiry({
  listingId,
  maxQty,
  pricePence,
  discountMinQty,
  discountPct,
}: {
  listingId:      string
  maxQty:         number
  pricePence:     number
  discountMinQty?: number | null
  discountPct?:    number | null
}) {
  const [qty, setQty] = useState(1)

  const change = (delta: number) =>
    setQty(q => Math.min(maxQty, Math.max(1, q + delta)))

  // Discount calculations
  const hasDiscount      = !!(discountMinQty && discountPct)
  const discountApplies  = hasDiscount && qty >= discountMinQty!
  const effectivePrice   = discountApplies
    ? Math.round(pricePence * (1 - discountPct! / 100))
    : pricePence
  const totalPence       = effectivePrice * qty
  const savedPence       = discountApplies ? (pricePence - effectivePrice) * qty : 0
  const piecesNeeded     = hasDiscount && !discountApplies ? discountMinQty! - qty : 0

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-stone-900">Request to buy</h3>

      {/* Qty stepper */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-stone-700">How many do you need?</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => change(-1)}
            disabled={qty <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-lg font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-30"
          >
            −
          </button>
          <span className="w-8 text-center text-lg font-semibold text-stone-900">{qty}</span>
          <button
            type="button"
            onClick={() => change(1)}
            disabled={qty >= maxQty}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-lg font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-30"
          >
            +
          </button>
          <span className="text-sm text-stone-400">of {maxQty} available</span>
        </div>
      </div>

      {/* Discount nudge — shown when discount exists but not yet met */}
      {hasDiscount && !discountApplies && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
          <span>🏷</span>
          <span className="text-amber-800">
            Add <strong>{piecesNeeded} more</strong> to unlock {discountPct}% off
            — buy {discountMinQty}+ pieces and save
          </span>
        </div>
      )}

      {/* Discount active banner */}
      {discountApplies && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#3DBE72]/40 bg-[#E8F7EE] px-3 py-2 text-xs">
          <span>✓</span>
          <span className="text-[#1C7040] font-medium">
            {discountPct}% bulk discount applied — saving {formatPrice(savedPence)}
          </span>
        </div>
      )}

      {/* Live price breakdown */}
      <div className="mb-5 rounded-lg bg-stone-50 px-4 py-3 text-sm space-y-1">
        {discountApplies ? (
          <>
            <div className="flex justify-between text-stone-400 line-through">
              <span>{qty} × {formatPrice(pricePence)} per piece</span>
              <span>{formatPrice(pricePence * qty)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">{qty} × {formatPrice(effectivePrice)} per piece (−{discountPct}%)</span>
              <span className="font-bold text-[#2A9E5A]">{formatPrice(totalPence)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-stone-500">
            <span>{qty} × {formatPrice(pricePence)} per piece</span>
            <span className="font-semibold text-stone-900">{formatPrice(totalPence)}</span>
          </div>
        )}
      </div>

      {/* Form — hidden inputs carry qty + discount info to the server action */}
      <form action={enquireListing}>
        <input type="hidden" name="listing_id"        value={listingId} />
        <input type="hidden" name="quantity"           value={qty} />
        <input type="hidden" name="discount_applied"   value={discountApplies ? '1' : '0'} />
        <input type="hidden" name="discount_pct"       value={discountPct ?? ''} />
        <input type="hidden" name="effective_price"    value={effectivePrice} />
        <SubmitButton
          pendingText="Sending…"
          className="w-full rounded-lg bg-[#3DBE72] py-2.5 font-semibold text-white transition-colors hover:bg-[#2A9E5A] disabled:opacity-60"
        >
          Send enquiry →
        </SubmitButton>
      </form>
      <p className="mt-2 text-center text-xs text-stone-400">
        The seller will be in touch to arrange payment and collection.
      </p>
    </div>
  )
}
