export const metadata = { title: 'Sign in' }

import Link from 'next/link'
import { login } from '../actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>
}) {
  const { error, redirect: redirectTo } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-stone-900">
          Offcut Challenge
        </Link>

        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-xl font-semibold text-stone-900">Log in</h1>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {redirectTo?.startsWith('/invite/') && (
            <p className="mb-4 rounded-lg bg-[#E8F7EE] px-4 py-3 text-sm text-[#1C7040]">
              Log in to accept your workshop invitation.
            </p>
          )}

          <form action={login} className="flex flex-col gap-4">
            {redirectTo && (
              <input type="hidden" name="redirect" value={redirectTo} />
            )}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-stone-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#3DBE72] focus:ring-2 focus:ring-[#3DBE72]/20"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-lg bg-[#3DBE72] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#2A9E5A]"
            >
              Log in
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-stone-500">
          Don&apos;t have an account?{' '}
          <Link
            href={redirectTo ? `/auth/signup?redirect=${encodeURIComponent(redirectTo)}` : '/auth/signup'}
            className="font-medium text-[#2A9E5A] hover:text-[#1C7040]"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
