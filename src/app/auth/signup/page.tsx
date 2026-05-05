import Link from 'next/link'
import { signup } from '../actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-stone-900">
          Offcut Challenge
        </Link>

        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-stone-900">Create an account</h1>
          <p className="mb-6 text-sm text-stone-500">For verified UK workshops only.</p>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </p>
          )}

          <form action={signup} className="flex flex-col gap-4">
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
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
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
                minLength={6}
                autoComplete="new-password"
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-amber-800"
            >
              Create account
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-amber-700 hover:text-amber-800">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}
