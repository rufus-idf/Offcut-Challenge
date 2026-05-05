export type Workshop = {
  id: string
  name: string
  slug: string
  verified: boolean
  created_at: string
}

export type Profile = {
  id: string
  workshop_id: string | null
  created_at: string
}

export type Listing = {
  id: string
  workshop_id: string
  material: string
  finish: string
  length_mm: number
  width_mm: number
  thickness_mm: number
  quantity: number
  price_pence: number
  description: string | null
  status: 'active' | 'sold' | 'archived'
  created_at: string
}

// Used on the browse page where we join workshop name onto each listing
export type ListingWithWorkshop = Listing & {
  workshops: { name: string }
}
