'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/format'
import { enquireListing } from '@/app/listings/[id]/actions'
import { SubmitButton } from '@/components/submit-button'

export function QuantityEnquiry({
  listingId,
  maxQty,
  pricePence,
}: {
  listingId: string
  maxQty: number
  pricePence: number
}) {
  const [qty, setQty] = useState(1)

  const change = (delta: number) =>
    setQty(q => Math.min(maxQty, Math.max(1, q + delta)))

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

      {/* Live price breakdown */}
      <div className="mb-5 rounded-lg bg-stone-50 px-4 py-3 text-sm">
        <div className="flex justify-between text-stone-500">
          <span>{qty} × {formatPrice(pricePence)} per piece</span>
          <span className="font-semibold text-stone-900">{formatPrice(pricePence * qty)}</span>
        </div>
      </div>

      {/* Hidden qty feeds into the server action */}
      <form action={enquireListing}>
        <input type="hidden" name="listing_id" value={listingId} />
        <input type="hidden" name="quantity" value={qty} />
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
