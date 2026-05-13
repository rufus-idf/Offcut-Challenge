import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { StarRating } from '@/components/star-rating'
import { ReviewForm } from './review-form'
import { submitReview, deleteReview } from './actions'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('workshops').select('name').eq('slug', slug).single()
  return { title: `Review ${data?.name ?? 'Workshop'}` }
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: workshop }, { data: profile }] = await Promise.all([
    supabase
      .from('workshops')
      .select('id, name, slug, town, county')
      .eq('slug', slug)
      .eq('verification_status', 'approved')
      .single(),
    supabase
      .from('profiles')
      .select('workshop_id, workshops(name)')
      .eq('id', user.id)
      .single(),
  ])

  if (!workshop) notFound()
  if (!profile?.workshop_id) redirect('/onboarding')
  if (workshop.id === profile.workshop_id) redirect(`/workshops/${slug}`)

  const viewerWorkshopName = (profile.workshops as unknown as { name: string } | null)?.name

  const { data: existing } = await supabase
    .from('reviews')
    .select('rating, comment')
    .eq('reviewer_workshop_id', profile.workshop_id)
    .eq('reviewed_workshop_id', workshop.id)
    .maybeSingle()

  const location = [workshop.town, workshop.county].filter(Boolean).join(', ')

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={viewerWorkshopName} />

      <main className="mx-auto max-w-lg px-6 py-12">
        <Link
          href={`/workshops/${slug}`}
          className="mb-8 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        >
          ← Back to {workshop.name}
        </Link>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          {/* Target workshop info */}
          <div className="mb-8 flex items-center gap-3 border-b border-stone-100 pb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F7EE]">
              <span className="text-sm font-bold text-[#2A9E5A]">
                {workshop.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-stone-900">{workshop.name}</p>
              {location && <p className="text-xs text-stone-400">{location}</p>}
            </div>
            {existing && (
              <div className="ml-auto">
                <StarRating rating={existing.rating} size="sm" />
              </div>
            )}
          </div>

          <h1 className="mb-1 text-xl font-bold text-stone-900">
            {existing ? 'Edit your review' : 'Leave a review'}
          </h1>
          <p className="mb-8 text-sm text-stone-500">
            Share your experience dealing with this workshop.
          </p>

          <ReviewForm
            reviewedWorkshopId={workshop.id}
            slug={slug}
            existingRating={existing?.rating ?? 0}
            existingComment={existing?.comment ?? ''}
            submitAction={submitReview}
            deleteAction={existing ? deleteReview : null}
          />
        </div>

        <p className="mt-5 text-center text-xs text-stone-400">
          Reviews are visible on the workshop&apos;s profile. Once Stripe payments are integrated,
          reviews will be restricted to verified purchases only.
        </p>
      </main>
    </div>
  )
}
