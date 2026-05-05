export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export function formatDimensions(l: number, w: number, t: number): string {
  return `${l} × ${w} × ${t}mm`
}
