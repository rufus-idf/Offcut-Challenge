import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '../auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // getUser() hits the Supabase auth server — more reliable than getSession()
  // which only reads the local cookie without verifying it server-side
  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-stone-900">Offcut Challenge</span>
          <div className="flex items-center gap-6">
            <span className="text-sm text-stone-500">{user.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm font-medium text-stone-700 hover:text-stone-900"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="mb-2 text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-stone-500">
          Week 1 complete — auth is working. Listings come next.
        </p>
      </main>
    </div>
  )
}
