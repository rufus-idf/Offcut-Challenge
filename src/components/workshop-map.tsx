'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type Workshop = {
  id: string
  name: string
  slug: string
  town: string | null
  county: string | null
  lat: number
  lng: number
}

function MapController({ workshop }: { workshop: Workshop | null }) {
  const map = useMap()
  useEffect(() => {
    if (workshop) {
      map.flyTo([workshop.lat, workshop.lng], 13, { duration: 1.2 })
    }
  }, [workshop, map])
  return null
}

export default function WorkshopMap({
  workshops,
  focusedId,
}: {
  workshops: Workshop[]
  focusedId: string | null
}) {
  const focused = workshops.find(w => w.id === focusedId) ?? null

  return (
    <MapContainer
      center={[54.2, -2.5]}
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController workshop={focused} />
      {workshops.map(w => {
        const isFocused = w.id === focusedId
        return (
          <CircleMarker
            key={w.id}
            center={[w.lat, w.lng]}
            radius={isFocused ? 14 : 10}
            pathOptions={{
              fillColor: isFocused ? '#1C7040' : '#3DBE72',
              color: isFocused ? '#1C7040' : '#2A9E5A',
              weight: isFocused ? 3 : 2,
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div style={{ minWidth: '140px' }}>
                <p style={{ fontWeight: 700, marginBottom: '2px' }}>{w.name}</p>
                {w.town && (
                  <p style={{ color: '#78716c', fontSize: '0.8rem', marginBottom: '6px' }}>
                    {[w.town, w.county].filter(Boolean).join(', ')}
                  </p>
                )}
                <a
                  href={`/workshops/${w.slug}`}
                  style={{ color: '#3DBE72', fontWeight: 600, fontSize: '0.82rem' }}
                >
                  View listings →
                </a>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
