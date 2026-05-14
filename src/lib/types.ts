export type StockItem = {
  id: string
  workshop_id: string
  source: 'manual' | 'camera'
  shape_type: 'RECT' | 'L' | 'C' | 'POLY'
  category: string
  material: string
  finish: string
  length_mm: number | null
  width_mm: number | null
  thickness_mm: number
  bbox_w_mm: number | null
  bbox_h_mm: number | null
  area_mm2: number | null
  vertices_mm: number[][] | null
  svg_path_data: string | null
  quantity: number
  description: string | null
  notes: string | null
  status: 'available' | 'listed' | 'sold' | 'used' | 'archived'
  created_at: string
}

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
  stock_item_id: string | null
  category: string
  material: string
  finish: string
  length_mm: number
  width_mm: number
  thickness_mm: number
  quantity: number
  price_pence: number
  discount_min_qty: number | null
  discount_pct: number | null
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

// Used on browse page — joins workshop name, location, coords, first image, and shape
export type ListingWithWorkshop = Listing & {
  shape_type?: string
  workshops: {
    name: string
    town: string | null
    county: string | null
    lat: number | null
    lng: number | null
  }
  listing_images: { storage_path: string; position: number }[]
}
