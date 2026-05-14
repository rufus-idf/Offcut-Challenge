import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { acceptInvite } from './actions'
import { SubmitButton } from '@/components/submit-button'

const ERROR_MESSAGES: Record<string, string> = {
  invalid:        'This invite link is invalid or has been removed.',
  used:           'This invite link has already been used or cancelled.',
  expired:        'This invite link has expired. Ask the workshop owner to send a new one.',
  already_member: 'Your account is already linked to a workshop. Each account can only belong to one workshop.',
  full:           'This workshop has reached its maximum of 3 members.',
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { token } = await params
  const { error: errorKey } = await searchParams

  const admin = createAdminClient()

  // Look up invite details (use admin to read without RLS)
  const { data: invitation } = await admin
    .from('invitations')
    .select('id, invited_email, status, expires_at, workshop_id, workshops(name)')
    .eq('token', token)
    .maybeSingle()

  // Determine the error state to show (from redirect or from DB state)
  let resolvedError: string | null = null

  if (errorKey && ERROR_MESSAGES[errorKey]) {
    resolvedError = ERROR_MESSAGES[errorKey]
  } else if (!invitation) {
    resolvedError = ERROR_MESSAGES.invalid
  } else if (invitation.status !== 'pending') {
    resolvedError = ERROR_MESSAGES.used
  } else if (new Date(invitation.expires_at) < new Date()) {
    resolvedError = ERROR_MESSAGES.expired
  }

  const workshopName = (invitation?.workshops as unknown as { name: string } | null)?.name ?? 'a workshop'

  // Check if the user is already logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const acceptAction = acceptInvite.bind(null, token)

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-stone-900">
          <span className="text-stone-900">Offcut</span>
          <span className="text-[#3DBE72]">Challenge</span>
        </Link>

        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">

          {resolvedError ? (
            <>
              <h1 className="mb-2 text-xl font-semibold text-stone-900">Invite unavailable</h1>
              <p className="text-sm text-stone-500">{resolvedError}</p>
            </>
          ) : (
            <>
              <h1 className="mb-1 text-xl font-semibold text-stone-900">Workshop invitation</h1>
              <p className="mb-6 text-sm text-stone-500">
                You&apos;ve been invited to join <strong className="text-stone-800">{workshopName}</strong> on Offcut Challenge.
              </p>

              <div className="mb-6 rounded-lg bg-[#E8F7EE] px-4 py-3 text-sm text-[#1C7040]">
                As a member you&apos;ll be able to add stock, publish listings, and manage inventory for {workshopName}.
              </div>

              {user ? (
                <form action={acceptAction}>
                  <SubmitButton
                    pendingText="Joining…"
                    className="w-full rounded-lg bg-[#3DBE72] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#2A9E5A] disabled:opacity-60"
                  >
                    Join {workshopName}
                  </SubmitButton>
                  <p className="mt-3 text-center text-xs text-stone-400">
                    Joining as <strong>{user.email}</strong>
                  </p>
                </form>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                    className="block w-full rounded-lg bg-[#3DBE72] px-4 py-2.5 text-center font-semibold text-white transition-colors hover:bg-[#2A9E5A]"
                  >
                    Log in to accept
                  </Link>
                  <Link
                    href={`/auth/signup?redirect=${encodeURIComponent(`/invite/${token}`)}`}
                    className="block w-full rounded-lg border border-stone-300 px-4 py-2.5 text-center text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    Create a new account
                  </Link>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </main>
  )
}
