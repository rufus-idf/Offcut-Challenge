import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ListingForm } from './listing-form'

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name, verification_status)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const workshop = profile.workshops as unknown as { name: string; verification_status: string } | null

  if (workshop?.verification_status !== 'approved') redirect('/dashboard')

  const { error } = await searchParams
  const workshopName = workshop?.name

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-stone-900">Add to my stock</h1>
        <p className="mb-8 text-sm text-stone-500">
          Items added here are private to your workshop. You can publish them to the public marketplace from your stock inventory.
        </p>
        <ListingForm error={error} />
      </main>
    </div>
  )
}
