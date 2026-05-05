export async function geocodePostcode(postcode: string): Promise<{ lat: number; lng: number } | null> {
  const clean = postcode.replace(/\s+/g, '').toUpperCase()
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
    next: { revalidate: 86400 }, // postcodes don't move — cache for 24 hours
  })
  if (!res.ok) return null
  const data = await res.json()
  if (data.status !== 200 || !data.result) return null
  return { lat: data.result.latitude, lng: data.result.longitude }
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (n: number) => (n * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
