'use client'

import { useState, useTransition } from 'react'
import { StarSelector } from '@/components/star-selector'

type Props = {
  reviewedWorkshopId: string
  slug: string
  existingRating: number
  existingComment: string
  submitAction: (fd: FormData) => Promise<void>
  deleteAction: ((fd: FormData) => Promise<void>) | null
}

export function ReviewForm({
  reviewedWorkshopId,
  slug,
  existingRating,
  existingComment,
  submitAction,
  deleteAction,
}: Props) {
  const [rating, setRating] = useState(existingRating)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (rating === 0) return
    const fd = new FormData(e.currentTarget)
    fd.set('rating', String(rating))
    startTransition(() => submitAction(fd))
  }

  const handleDelete = () => {
    if (!deleteAction) return
    const fd = new FormData()
    fd.set('reviewed_workshop_id', reviewedWorkshopId)
    fd.set('slug', slug)
    startDeleteTransition(() => deleteAction(fd))
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="reviewed_workshop_id" value={reviewedWorkshopId} />
        <input type="hidden" name="slug" value={slug} />

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700">Your rating</label>
          <StarSelector value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700">
            Comment{' '}
            <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <textarea
            name="comment"
            defaultValue={existingComment}
            rows={4}
            placeholder="Describe your experience — quality of the materials, communication, packaging…"
            className="w-full resize-none rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20"
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || isPending}
          className="w-full rounded-full bg-[#3DBE72] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2A9E5A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? 'Saving…' : existingRating ? 'Update review' : 'Submit review'}
        </button>
      </form>

      {deleteAction && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="mt-3 w-full rounded-full border border-stone-200 py-3 text-sm text-stone-500 transition-colors hover:border-red-200 hover:text-red-500 disabled:opacity-40"
        >
          {isDeleting ? 'Removing…' : 'Remove review'}
        </button>
      )}
    </div>
  )
}
