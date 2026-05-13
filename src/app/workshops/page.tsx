export const metadata = { title: 'Workshop Map' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { WorkshopsClient } from './workshops-client'

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

  // Fetch all verified workshops — map filters to those with coordinates,
  // the list shows everyone
  const { data: workshops } = await supabase
    .from('workshops')
    .select('id, name, slug, town, county, lat, lng')
    .eq('verification_status', 'approved')
    .order('name')

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Workshops</h1>
          <p className="mt-1 text-sm text-stone-500">
            Find verified UK workshops and browse their available offcuts
          </p>
        </div>

        <WorkshopsClient workshops={workshops ?? []} />
      </main>
    </div>
  )
}
