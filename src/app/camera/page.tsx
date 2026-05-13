export const metadata = { title: 'Camera Integration' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { generateApiKey } from '@/app/dashboard/api-key-actions'

export default async function CameraPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string }>
}) {
  const { purchased } = await searchParams

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
  const workshopName = workshop?.name

  const { data: apiKeyRow } = await supabase
    .from('workshop_api_keys')
    .select('api_key, created_at')
    .eq('workshop_id', profile.workshop_id)
    .single()

  const hasPurchased = !!apiKeyRow || purchased === '1'

  return (
    <div className="min-h-screen bg-stone-50">
      <Header email={user.email!} workshopName={workshopName} />

      <main className="mx-auto max-w-3xl px-6 py-10">

        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="text-5xl">📷</span>
          <h1 className="mt-4 text-3xl font-bold text-stone-900">Camera App Integration</h1>
          <p className="mt-3 text-lg text-stone-500">
            Scan offcuts above your CNC bed and push them straight into your stock — no typing, no manual entry.
          </p>
        </div>

        {/* Feature list */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: '⚡', title: 'Instant scanning', desc: 'Detects shape, dimensions, and thickness automatically using your camera.' },
            { icon: '📐', title: 'Any shape', desc: 'Handles rectangles, L-shapes, C-shapes, and irregular polygons.' },
            { icon: '🔗', title: 'Direct to stock', desc: 'Scanned pieces land in your private stock ready to review and publish.' },
          ].map(f => (
            <div key={f.title} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <span className="text-2xl">{f.icon}</span>
              <p className="mt-2 font-semibold text-stone-900">{f.title}</p>
              <p className="mt-1 text-sm text-stone-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {hasPurchased ? (
          /* API key section — shown once purchased */
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-base font-semibold text-stone-900">Your API key</h2>
            <p className="mb-5 text-sm text-stone-500">
              Paste this into your camera app settings once during setup. Keep it private — it grants access to your stock.
            </p>

            {apiKeyRow ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-stone-500">API key</label>
                  <input
                    readOnly
                    value={apiKeyRow.api_key}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm text-stone-700 outline-none"
                  />
                </div>

                <div className="rounded-lg bg-stone-50 px-4 py-3 text-xs text-stone-500">
                  <p className="font-medium text-stone-700">Ingest endpoint</p>
                  <p className="mt-0.5 font-mono">POST https://offcut-challenge.vercel.app/api/ingest</p>
                  <p className="mt-2 font-medium text-stone-700">Authorization header</p>
                  <p className="mt-0.5 font-mono">Bearer {'<your-api-key>'}</p>
                </div>

                <form action={generateApiKey}>
                  <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                    Regenerate key (invalidates the current one)
                  </button>
                </form>
              </div>
            ) : (
              <form action={generateApiKey}>
                <button
                  type="submit"
                  className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700"
                >
                  Generate API key
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Purchase CTA — shown before purchase */
          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-8 text-center">
            <p className="text-lg font-semibold text-amber-900">Ready to connect your camera?</p>
            <p className="mt-2 text-sm text-stone-600">
              The camera app is available as a separate add-on. Purchase it from our product store
              and your API key will appear here automatically.
            </p>
            <a
              href="https://offcutchallenge.co.uk/camera"
              className="mt-6 inline-block rounded-lg bg-amber-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-amber-800"
            >
              Purchase Camera App →
            </a>
            <p className="mt-3 text-xs text-stone-400">
              Already purchased?{' '}
              <a href="/camera?purchased=1" className="text-amber-700 hover:underline">
                Click here to generate your API key
              </a>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
