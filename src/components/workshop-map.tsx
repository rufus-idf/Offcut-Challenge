'use client'

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type Workshop = {
  id: string
  name: string
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
            <strong>{w.name}</strong>
            {w.town && (
              <><br />{[w.town, w.county].filter(Boolean).join(', ')}</>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
