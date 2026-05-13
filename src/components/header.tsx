import Link from 'next/link'
import { logout } from '@/app/auth/actions'

interface HeaderProps {
  email: string
  workshopName?: string
}

export function Header({ email, workshopName }: HeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-bold text-stone-900">
            Offcut Challenge
          </Link>
          <nav className="flex gap-6">
            <Link href="/dashboard" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              My Stock
            </Link>
            <Link href="/listings" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Browse Listings
            </Link>
            <Link href="/workshops" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Map
            </Link>
            <Link href="/settings" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          {workshopName && (
            <span className="text-sm font-medium text-stone-700">{workshopName}</span>
          )}
          <span className="text-sm text-stone-400">{email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
