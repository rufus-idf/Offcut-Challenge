export const metadata = { title: 'Workshop Settings' }

import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { getLogoUrl } from '@/lib/format'
import { updateWebsiteUrl, uploadLogo, removeLogo } from './actions'
import { SubmitButton } from '@/components/submit-button'

const inputClass = 'rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const { message, error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id, workshops(id, name, slug, logo_url, website_url, verification_status)')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const workshop = profile.workshops as unknown as {
    id: string
    name: string
    slug: string
    logo_url: string | null
    website_url: string | null
    verification_status: string
  } | null

  if (!workshop) redirect('/onboarding')

  const websiteAction = updateWebsiteUrl.bind(null, workshop.id)
  const logoAction    = uploadLogo.bind(null, workshop.id)
  const removeAction  = removeLogo.bind(null, workshop.id)

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Header email={user.email!} workshopName={workshop.name} />

      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Workshop settings</h1>
          <p className="mt-1 text-sm text-stone-500">{workshop.name}</p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-3">
            <p className="text-sm text-green-800">{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Logo */}
        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-stone-900">Workshop logo</h2>

          {workshop.logo_url ? (
            <div className="mb-4 flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                <Image
                  src={getLogoUrl(workshop.logo_url)}
                  alt={`${workshop.name} logo`}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">Current logo</p>
                <form action={removeAction} className="mt-1">
                  <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                    Remove logo
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-stone-200 bg-stone-50">
              <p className="text-xs text-stone-400">No logo</p>
            </div>
          )}

          <form action={logoAction} encType="multipart/form-data" className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                type="file"
                name="logo"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                required
                className="flex-1 text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
              />
              <SubmitButton
                pendingText="Uploading…"
                className="rounded-lg bg-[#3DBE72] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A9E5A] disabled:opacity-60"
              >
                Upload
              </SubmitButton>
            </div>
            <p className="text-xs text-stone-400">JPEG, PNG, WebP or SVG · max 2MB · square images work best</p>
          </form>
        </div>

        {/* Website URL */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-stone-900">Website</h2>
          <form action={websiteAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="website_url" className="text-sm font-medium text-stone-700">
                Your workshop website
              </label>
              <input
                id="website_url"
                name="website_url"
                type="url"
                placeholder="https://yourworkshop.co.uk"
                defaultValue={workshop.website_url ?? ''}
                className={inputClass}
              />
              <p className="text-xs text-stone-400">
                Shown on your public profile so other workshops can find you.
              </p>
            </div>
            <div>
              <SubmitButton
                pendingText="Saving…"
                className="rounded-lg bg-[#3DBE72] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2A9E5A] disabled:opacity-60"
              >
                Save
              </SubmitButton>
            </div>
          </form>
        </div>

        {workshop.verification_status === 'approved' && (
          <p className="mt-4 text-center text-xs text-stone-400">
            Your public profile:{' '}
            <a href={`/workshops/${workshop.slug}`} className="text-[#2A9E5A] hover:underline">
              /workshops/{workshop.slug}
            </a>
          </p>
        )}
      </main>
    </div>
  )
}
