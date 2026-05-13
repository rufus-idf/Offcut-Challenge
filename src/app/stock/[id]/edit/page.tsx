export const metadata = { title: 'Edit stock item' }

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { EditStockForm } from './edit-stock-form'

export default async function EditStockPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const { data: item } = await supabase
    .from('stock_items')
    .select('*')
    .eq('id', id)
    .single()

  // Only allow editing items that haven't been published yet
  if (!item || item.status !== 'available') notFound()

  const workshopName = (profile.workshops as unknown as { name: string } | null)?.name

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Edit stock item</h1>
          <p className="mt-2 text-sm text-stone-500">
            Update the details before publishing to the marketplace.
          </p>
        </div>

        <EditStockForm item={item} error={error} />
      </main>
    </div>
  )
}
