import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { formatPrice, formatDimensions } from '@/lib/format'
import type { Listing } from '@/lib/types'

const STATUS_STYLES: Record<Listing['status'], string> = {
  active:   'bg-green-50 text-green-700',
  sold:     'bg-stone-100 text-stone-500',
  archived: 'bg-stone-100 text-stone-500',
}

type ListingWithImageCount = Listing & { listing_images: { id: string }[] }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(id, name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const workshop = profile.workshops as unknown as { id: string; name: string } | null

  const { data: listings } = await supabase
    .from('listings')
    .select('id, material, finish, length_mm, width_mm, thickness_mm, quantity, price_pence, status, created_at, listing_images(id)')
    .eq('workshop_id', profile.workshop_id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshop?.name} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{workshop?.name}</h1>
            <p className="mt-1 text-sm text-stone-500">Your listings</p>
          </div>
          <Link
            href="/listings/new"
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
          >
            + New listing
          </Link>
        </div>

        {!listings?.length ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white py-20 text-center">
            <p className="mb-4 text-stone-500">No listings yet.</p>
            <Link
              href="/listings/new"
              className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
            >
              Post your first listing
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs font-medium uppercase tracking-wide text-stone-400">
                  <th className="px-5 py-3">Material</th>
                  <th className="px-5 py-3">Dimensions</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Photos</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(listings as ListingWithImageCount[]).map(listing => (
                  <tr key={listing.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3">
                      <Link href={`/listings/${listing.id}`} className="hover:underline">
                        <p className="font-medium text-stone-900">{listing.material}</p>
                        <p className="text-stone-400">{listing.finish}</p>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      {formatDimensions(listing.length_mm, listing.width_mm, listing.thickness_mm)}
                    </td>
                    <td className="px-5 py-3 text-stone-600">{listing.quantity}</td>
                    <td className="px-5 py-3 font-medium text-stone-900">
                      {formatPrice(listing.price_pence)}
                    </td>
                    <td className="px-5 py-3 text-stone-500">
                      {listing.listing_images.length > 0
                        ? `${listing.listing_images.length} photo${listing.listing_images.length !== 1 ? 's' : ''}`
                        : <span className="text-stone-300">None</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[listing.status]}`}>
                        {listing.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
