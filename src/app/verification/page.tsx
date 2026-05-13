export const metadata = { title: 'Verify your workshop' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { submitVerification } from './actions'

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(name, verification_status, rejection_reason, companies_house_number, vat_number, town, county, postcode)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const workshop = profile.workshops as unknown as {
    name: string
    verification_status: string
    rejection_reason: string | null
    companies_house_number: string | null
    vat_number: string | null
    town: string | null
    county: string | null
    postcode: string | null
  } | null

  // Pending and approved workshops don't need to see this form
  if (workshop?.verification_status === 'pending' || workshop?.verification_status === 'approved') {
    redirect('/dashboard')
  }

  const { error } = await searchParams
  const isResubmission = workshop?.verification_status === 'rejected'

  const inputClass = 'rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshop?.name} />

      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Verify your workshop</h1>
          <p className="mt-2 text-sm text-stone-500">
            We verify all workshops against Companies House before granting access to the marketplace.
          </p>
        </div>

        {isResubmission && workshop?.rejection_reason && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-800">Previous application was not approved</p>
            <p className="mt-1 text-sm text-red-700">{workshop.rejection_reason}</p>
          </div>
        )}

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <form action={submitVerification} className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="grid gap-5">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="companies_house_number" className="text-sm font-medium text-stone-700">
                Companies House number
              </label>
              <input
                id="companies_house_number"
                name="companies_house_number"
                type="text"
                required
                defaultValue={workshop?.companies_house_number ?? ''}
                placeholder="e.g. 12345678 or SC123456"
                className={inputClass}
              />
              <p className="text-xs text-stone-400">
                Find yours at{' '}
                <a href="https://find-and-update.company-information.service.gov.uk" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">
                  find-and-update.company-information.service.gov.uk
                </a>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="vat_number" className="text-sm font-medium text-stone-700">
                VAT number <span className="font-normal text-stone-400">(optional — only if VAT registered)</span>
              </label>
              <input
                id="vat_number"
                name="vat_number"
                type="text"
                defaultValue={workshop?.vat_number ?? ''}
                placeholder="e.g. GB123456789"
                className={inputClass}
              />
            </div>

            <div className="border-t border-stone-100 pt-2">
              <p className="mb-4 text-sm font-medium text-stone-700">Shipping location</p>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="town" className="text-sm font-medium text-stone-700">Town / city</label>
                    <input
                      id="town"
                      name="town"
                      type="text"
                      required
                      defaultValue={workshop?.town ?? ''}
                      placeholder="e.g. Bristol"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="county" className="text-sm font-medium text-stone-700">County</label>
                    <input
                      id="county"
                      name="county"
                      type="text"
                      required
                      defaultValue={workshop?.county ?? ''}
                      placeholder="e.g. Somerset"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="postcode" className="text-sm font-medium text-stone-700">Postcode</label>
                  <input
                    id="postcode"
                    name="postcode"
                    type="text"
                    required
                    defaultValue={workshop?.postcode ?? ''}
                    placeholder="e.g. BS1 4DJ"
                    className="w-40 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                  />
                </div>
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-amber-800"
          >
            {isResubmission ? 'Resubmit application' : 'Submit for review'}
          </button>
        </form>
      </main>
    </div>
  )
}
