'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { StarRating } from '@/components/star-rating'
import { ShapePreviewModal } from '@/components/shape-preview-modal'
import { formatPrice, formatDimensions, getImageUrl } from '@/lib/format'

type ListingRow = {
  id: string
  material: string
  finish: string
  category: string
  length_mm: number | null
  width_mm: number | null
  thickness_mm: number | null
  quantity: number
  price_pence: number
  listing_images: { storage_path: string }[]
  stock_items: {
    shape_type: string
    vertices_mm: number[][] | null
    bbox_w_mm: number | null
    bbox_h_mm: number | null
  } | null
}

type ReviewRow = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer_workshop_id: string
  reviewer: { name: string; slug: string } | null
}

type Props = {
  listings: ListingRow[]
  reviews: ReviewRow[]
  slug: string
  isOwnProfile: boolean
  viewerWorkshopId: string
}

type Tab = 'listings' | 'reviews'

export function WorkshopTabs({ listings, reviews, slug, isOwnProfile, viewerWorkshopId }: Props) {
  const [activeTab, setActiveTab]   = useState<Tab>('listings')
  const [visible, setVisible]       = useState(true)

  const switchTab = (tab: Tab) => {
    if (tab === activeTab) return
    setVisible(false)
    setTimeout(() => {
      setActiveTab(tab)
      setVisible(true)
    }, 140)
  }

  const myReview = reviews.find(r => r.reviewer_workshop_id === viewerWorkshopId)

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'listings', label: 'Active listings', count: listings.length },
    { key: 'reviews',  label: 'Reviews',         count: reviews.length  },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex items-center justify-between border-b border-stone-200">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`-mb-px border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-[#3DBE72] text-[#2A9E5A]'
                  : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
              }`}
            >
              {tab.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.key
                  ? 'bg-[#E8F7EE] text-[#2A9E5A]'
                  : 'bg-stone-100 text-stone-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Review CTA — only visible on reviews tab for non-owners */}
        {activeTab === 'reviews' && !isOwnProfile && (
          <Link
            href={`/workshops/${slug}/review`}
            className="rounded-full bg-[#3DBE72] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2A9E5A]"
          >
            {myReview ? 'Edit your review' : '+ Leave a review'}
          </Link>
        )}
      </div>

      {/* Content — fades between tabs */}
      <div
        className="transition-opacity duration-[140ms]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {activeTab === 'listings' ? (
          listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center">
              <p className="text-stone-400">No active listings from this workshop.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map(listing => {
                const images = Array.isArray(listing.listing_images) ? listing.listing_images : []
                const firstImage = images[0]
                const stock = listing.stock_items
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] bg-stone-100">
                      {firstImage ? (
                        <Image
                          src={getImageUrl(firstImage.storage_path)}
                          alt={`${listing.material} ${listing.finish}`}
                          fill className="object-cover"
                          sizes="(max-width: 640px) 100vw, 25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-stone-50 p-4">
                          <ShapePreviewModal
                            shapeType={stock?.shape_type ?? 'RECT'}
                            verticesMm={stock?.vertices_mm ?? null}
                            lengthMm={listing.length_mm}
                            widthMm={listing.width_mm}
                            thicknessMm={listing.thickness_mm ?? 0}
                            bboxWMm={stock?.bbox_w_mm ?? null}
                            bboxHMm={stock?.bbox_h_mm ?? null}
                            thumbnailShowLabels
                            thumbnailClassName="h-full w-full"
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-stone-900 transition-colors group-hover:text-[#2A9E5A]">
                            {listing.material}
                          </p>
                          <p className="text-sm text-stone-500">{listing.finish}</p>
                        </div>
                        <p className="shrink-0 font-bold text-[#2A9E5A]">{formatPrice(listing.price_pence)}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
                        {listing.length_mm && listing.width_mm
                          ? <span>{formatDimensions(listing.length_mm, listing.width_mm, listing.thickness_mm ?? 0)}</span>
                          : <span>{listing.category}</span>
                        }
                        <span>Qty {listing.quantity}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        ) : (
          /* Reviews tab */
          reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white py-12 text-center">
              <p className="text-stone-400">No reviews yet.</p>
              {!isOwnProfile && (
                <Link href={`/workshops/${slug}/review`} className="mt-3 inline-block text-sm text-[#2A9E5A] hover:underline">
                  Be the first to leave one →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => {
                const isOwnReview = review.reviewer_workshop_id === viewerWorkshopId
                const date = new Date(review.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                return (
                  <div
                    key={review.id}
                    className={`rounded-xl border bg-white p-5 shadow-sm ${
                      isOwnReview ? 'border-[#3DBE72]/30' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F7EE]">
                          <span className="text-xs font-bold text-[#2A9E5A]">
                            {(review.reviewer?.name ?? '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          {review.reviewer ? (
                            <Link href={`/workshops/${review.reviewer.slug}`} className="text-sm font-semibold text-stone-900 hover:text-[#2A9E5A]">
                              {review.reviewer.name}
                            </Link>
                          ) : (
                            <p className="text-sm font-semibold text-stone-900">Unknown workshop</p>
                          )}
                          <p className="text-xs text-stone-400">{date}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StarRating rating={review.rating} size="sm" />
                        {isOwnReview && (
                          <Link href={`/workshops/${slug}/review`} className="text-xs text-stone-400 hover:text-[#2A9E5A]">
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-stone-600">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
