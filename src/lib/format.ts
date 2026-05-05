export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export function formatDimensions(l: number, w: number, t: number): string {
  return `${l} × ${w} × ${t}mm`
}

export function getImageUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${storagePath}`
}
