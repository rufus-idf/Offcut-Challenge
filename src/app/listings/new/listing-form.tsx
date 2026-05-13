'use client'

import { useState } from 'react'
import { CATEGORIES, MATERIALS_BY_CATEGORY, FINISHES_BY_CATEGORY, type Category } from '@/lib/constants'
import { createListing } from './actions'
import { SubmitButton } from '@/components/submit-button'

const inputClass =
  'rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20'

export function ListingForm({ error }: { error?: string }) {
  const [category, setCategory] = useState<Category>('Wood')

  return (
    <form action={createListing} className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-6">

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-stone-700">Category</label>
          <select
            id="category" name="category"
            value={category}
            onChange={e => setCategory(e.target.value as Category)}
            className={inputClass}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="material" className="text-sm font-medium text-stone-700">Material</label>
            <select id="material" name="material" required key={`material-${category}`} className={inputClass}>
              <option value="">Select…</option>
              {MATERIALS_BY_CATEGORY[category].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="finish" className="text-sm font-medium text-stone-700">Finish</label>
            <select id="finish" name="finish" required key={`finish-${category}`} className={inputClass}>
              <option value="">Select…</option>
              {FINISHES_BY_CATEGORY[category].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">Dimensions (mm)</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="length_mm" className="text-xs text-stone-500">Length</label>
              <input id="length_mm" name="length_mm" type="number" required min="1" placeholder="e.g. 1200" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="width_mm" className="text-xs text-stone-500">Width</label>
              <input id="width_mm" name="width_mm" type="number" required min="1" placeholder="e.g. 600" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="thickness_mm" className="text-xs text-stone-500">Thickness</label>
              <input id="thickness_mm" name="thickness_mm" type="number" required min="1" placeholder="e.g. 18" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="quantity" className="text-sm font-medium text-stone-700">Quantity</label>
          <input id="quantity" name="quantity" type="number" required min="1" defaultValue="1" className={`${inputClass} w-32`} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-stone-700">
            Description <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <textarea
            id="description" name="description" rows={3}
            placeholder="Any useful details — condition, why it's leftover, etc."
            className={`${inputClass} resize-none`}
          />
        </div>

      </div>

      <div className="mt-8 flex gap-3">
        <SubmitButton
          pendingText="Adding…"
          className="rounded-lg bg-[#3DBE72] px-6 py-2.5 font-semibold text-white transition-colors hover:bg-[#2A9E5A] disabled:opacity-60"
        >
          Add to my stock
        </SubmitButton>
        <a
          href="/dashboard"
          className="rounded-lg border border-stone-300 px-6 py-2.5 font-semibold text-stone-700 transition-colors hover:bg-stone-50"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
