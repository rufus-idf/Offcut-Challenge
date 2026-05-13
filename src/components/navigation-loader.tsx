'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const shimmerStyle = (color: string, dimColor: string) => ({
  background: `linear-gradient(90deg, ${dimColor} 0%, ${color} 50%, ${dimColor} 100%)`,
  backgroundSize: '300% auto',
  WebkitBackgroundClip: 'text' as const,
  backgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  animation: 'text-shimmer 1.6s ease-in-out infinite',
})

function LogoOverlay() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 top-16 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ background: 'rgba(28,28,30,0.70)' }}
    >
      <p className="select-none text-4xl font-black" style={{ letterSpacing: '-0.03em' }}>
        <span style={shimmerStyle('#ffffff', 'rgba(255,255,255,0.25)')}>Offcut</span>
        <span style={shimmerStyle('#3DBE72', 'rgba(61,190,114,0.25)')}>Challenge</span>
      </p>
    </div>
  )
}

export function NavigationLoader() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()

  // Dismiss as soon as the new route renders
  useEffect(() => {
    setLoading(false)
  }, [pathname])

  // Show on any internal anchor click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Skip external, hash-only, mailto, tel, and _blank links
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.getAttribute('target') === '_blank' ||
        anchor.hasAttribute('download')
      ) return

      setLoading(true)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return loading ? <LogoOverlay /> : null
}
