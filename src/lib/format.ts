export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export function formatDimensions(l: number, w: number, t: number): string {
  return `${l} × ${w} × ${t}mm`
}

export function getImageUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${storagePath}`
}

export function getLogoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/workshop-logos/${storagePath}`
}

export function formatDistance(km: number): string {
  const miles = km * 0.621371
  if (miles < 1) return '< 1 mile away'
  return `~${Math.round(miles)} mile${Math.round(miles) === 1 ? '' : 's'} away`
}
