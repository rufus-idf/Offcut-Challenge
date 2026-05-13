'use client'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
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

export default function WorkshopMap({ workshops }: { workshops: Workshop[] }) {
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
      {workshops.map(w => (
        <CircleMarker
          key={w.id}
          center={[w.lat, w.lng]}
          radius={10}
          pathOptions={{
            fillColor: '#b45309',
            color: '#92400e',
            weight: 2,
            fillOpacity: 0.85,
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
                style={{ color: '#b45309', fontWeight: 600, fontSize: '0.82rem' }}
              >
                View listings →
              </a>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
