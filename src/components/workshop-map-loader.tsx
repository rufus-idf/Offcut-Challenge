'use client'

import dynamic from 'next/dynamic'

type Workshop = {
  id: string
  name: string
  slug: string
  town: string | null
  county: string | null
  lat: number
  lng: number
}

// Dynamic import lives in a Client Component — this is the correct pattern for
// libraries that need browser APIs (window/document). Turbopack requires ssr:false
// to be inside a 'use client' file, not a Server Component page.
const WorkshopMap = dynamic(() => import('./workshop-map'), { ssr: false })

export function WorkshopMapLoader({ workshops }: { workshops: Workshop[] }) {
  return <WorkshopMap workshops={workshops} />
}
