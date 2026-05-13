import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-stone-900">
          Offcut Challenge
        </h1>
        <p className="mb-10 text-lg text-stone-500">
          The UK marketplace for timber offcuts between workshops.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/signup"
            className="rounded-lg bg-[#3DBE72] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#2A9E5A]"
          >
            Apply for access
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg border border-stone-300 px-6 py-3 font-semibold text-stone-700 transition-colors hover:bg-stone-100"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  )
}
