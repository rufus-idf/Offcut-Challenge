import Link from 'next/link'
import { logout } from '@/app/auth/actions'

interface HeaderProps {
  email: string
  workshopName?: string
}

export function Header({ email, workshopName }: HeaderProps) {
  return (
    <header className="bg-[#1C1C1E] border-b border-white/[0.07]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo + nav */}
        <div className="flex items-center gap-10">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            <span className="text-white">Offcut</span>
            <span className="text-[#3DBE72]">Challenge</span>
          </Link>

          <nav className="flex items-center gap-7">
            <Link href="/dashboard" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              My Stock
            </Link>
            <Link href="/listings" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              Browse Listings
            </Link>
            <Link href="/workshops" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              Map
            </Link>
            <Link href="/camera" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              Camera
            </Link>
          </nav>
        </div>

        {/* Right — workshop pill + logout */}
        <div className="flex items-center gap-4">
          {workshopName && (
            <Link
              href="/settings"
              className="rounded-full bg-[#3DBE72] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#2A9E5A]"
              title="Workshop settings"
            >
              {workshopName}
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-medium text-white/50 transition-colors hover:text-white/90"
            >
              Log out
            </button>
          </form>
        </div>

      </div>
    </header>
  )
}
