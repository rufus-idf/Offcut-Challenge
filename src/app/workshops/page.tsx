import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'

// Leaflet uses window/document — must be loaded client-side only
const WorkshopMap = dynamic(() => import('@/components/workshop-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-stone-400">
      Loading map…
    </div>
  ),
})

export default async function WorkshopsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const { data: workshops } = await supabase
    .from('workshops')
    .select('id, name, town, county, lat, lng')
    .eq('verification_status', 'approved')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name
  const count = workshops?.length ?? 0

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Workshop map</h1>
          <p className="mt-1 text-sm text-stone-500">
            {count} verified workshop{count !== 1 ? 's' : ''} across the UK
          </p>
        </div>

        <div
          className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          style={{ height: '620px' }}
        >
          <WorkshopMap workshops={(workshops ?? []) as { id: string; name: string; town: string | null; county: string | null; lat: number; lng: number }[]} />
        </div>

        {count === 0 && (
          <p className="mt-4 text-center text-sm text-stone-400">
            No workshops with a verified location yet. Locations appear once a workshop completes verification.
          </p>
        )}
      </main>
    </div>
  )
}
