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
  category: string
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

export type ListingImage = {
  id: string
  listing_id: string
  storage_path: string
  position: number
  created_at: string
}

// Used on browse page — joins workshop name and first image
export type ListingWithWorkshop = Listing & {
  workshops: { name: string }
  listing_images: { storage_path: string; position: number }[]
}
