export const metadata = { title: 'Admin' }

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { approveWorkshop, rejectWorkshop, geocodeMissingWorkshops } from './actions'

const ADMIN_EMAIL = 'rufus@i-designfurniture.com'

const STATUS_STYLES: Record<string, string> = {
  unverified: 'bg-stone-100 text-stone-500',
  pending:    'bg-amber-50 text-amber-700',
  approved:   'bg-green-50 text-green-700',
  rejected:   'bg-red-50 text-red-700',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Return 404 to non-admins — don't reveal this page exists
  if (user.email !== ADMIN_EMAIL) notFound()

  const { data: workshops } = await supabase
    .from('workshops')
    .select('*')
    .order('created_at', { ascending: false })

  const pending  = workshops?.filter(w => w.verification_status === 'pending')  ?? []
  const others   = workshops?.filter(w => w.verification_status !== 'pending')  ?? []
  const sorted   = [...pending, ...others]

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <span className="text-lg font-bold text-stone-900">Offcut Challenge</span>
            <span className="ml-3 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">Admin</span>
          </div>
          <span className="text-sm text-stone-400">{user.email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Workshop applications</h1>
            {pending.length > 0 && (
              <p className="mt-1 text-sm text-amber-700">{pending.length} pending review</p>
            )}
          </div>
          <form action={geocodeMissingWorkshops}>
            <button
              type="submit"
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Geocode missing locations
            </button>
          </form>
        </div>

        {!sorted.length ? (
          <p className="text-stone-500">No workshops yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map(workshop => (
              <div
                key={workshop.id}
                className={`rounded-xl border bg-white p-6 shadow-sm ${workshop.verification_status === 'pending' ? 'border-amber-200' : 'border-stone-200'}`}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-stone-900">{workshop.name}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[workshop.verification_status]}`}>
                        {workshop.verification_status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-400">
                      Registered {new Date(workshop.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {workshop.companies_house_number && (
                  <dl className="mb-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-stone-400">CH number</dt>
                      <dd className="font-medium text-stone-900">{workshop.companies_house_number}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-400">CH verified name</dt>
                      <dd className="font-medium text-stone-900">{workshop.companies_house_name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-400">VAT number</dt>
                      <dd className="font-medium text-stone-900">{workshop.vat_number ?? 'Not provided'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-stone-400">Location</dt>
                      <dd className="font-medium text-stone-900">
                        {[workshop.town, workshop.county, workshop.postcode].filter(Boolean).join(', ') || '—'}
                      </dd>
                    </div>
                  </dl>
                )}

                {workshop.rejection_reason && (
                  <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    Rejection reason: {workshop.rejection_reason}
                  </p>
                )}

                {/* Actions — only shown for pending workshops */}
                {workshop.verification_status === 'pending' && (
                  <div className="flex flex-wrap items-end gap-3 border-t border-stone-100 pt-4">
                    <form action={approveWorkshop.bind(null, workshop.id)}>
                      <button
                        type="submit"
                        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                      >
                        Approve
                      </button>
                    </form>

                    <form action={rejectWorkshop.bind(null, workshop.id)} className="flex items-end gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-stone-500">Rejection reason</label>
                        <input
                          name="reason"
                          type="text"
                          placeholder="e.g. Could not verify company details"
                          className="w-72 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                )}

                {/* Allow re-review of approved/rejected workshops */}
                {(workshop.verification_status === 'approved' || workshop.verification_status === 'rejected') && workshop.companies_house_number && (
                  <div className="flex gap-3 border-t border-stone-100 pt-4">
                    {workshop.verification_status === 'rejected' && (
                      <form action={approveWorkshop.bind(null, workshop.id)}>
                        <button type="submit" className="text-sm text-green-700 hover:underline">
                          Approve instead
                        </button>
                      </form>
                    )}
                    {workshop.verification_status === 'approved' && (
                      <form action={rejectWorkshop.bind(null, workshop.id)} className="flex items-center gap-2">
                        <input name="reason" type="text" placeholder="Reason" className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none" />
                        <button type="submit" className="text-sm text-red-600 hover:underline">Revoke approval</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
