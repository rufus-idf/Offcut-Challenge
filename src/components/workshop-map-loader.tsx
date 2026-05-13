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

const WorkshopMap = dynamic(() => import('./workshop-map'), { ssr: false })

export function WorkshopMapLoader({
  workshops,
  focusedId,
}: {
  workshops: Workshop[]
  focusedId: string | null
}) {
  return <WorkshopMap workshops={workshops} focusedId={focusedId} />
}
