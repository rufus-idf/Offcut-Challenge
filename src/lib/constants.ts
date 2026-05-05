export const CATEGORIES = ['Wood', 'Metal', 'Plastic', 'Other'] as const
export type Category = (typeof CATEGORIES)[number]

export const MATERIALS_BY_CATEGORY: Record<Category, readonly string[]> = {
  Wood:    ['MDF', 'Plywood', 'Chipboard', 'Oak', 'Birch ply', 'Pine', 'Walnut', 'Beech'],
  Metal:   ['Mild steel', 'Stainless steel', 'Aluminium', 'Copper', 'Brass', 'Cast iron'],
  Plastic: ['Acrylic', 'HDPE', 'Polypropylene', 'PVC', 'Polycarbonate', 'ABS'],
  Other:   ['Foam', 'Rubber', 'Cork', 'Composite', 'Carbon fibre', 'Glass'],
}

export const FINISHES_BY_CATEGORY: Record<Category, readonly string[]> = {
  Wood:    ['Raw / unfinished', 'White melamine', 'Oak veneer', 'Walnut veneer', 'Black melamine', 'Birch faced', 'Pre-primed', 'Laminated'],
  Metal:   ['Raw / unfinished', 'Powder coated', 'Galvanised', 'Brushed', 'Anodised', 'Painted', 'Polished'],
  Plastic: ['Natural', 'Clear', 'Frosted', 'Coloured', 'Textured'],
  Other:   ['Raw / unfinished', 'Coated', 'Treated'],
}

// Flat lists used in browse filters (all categories combined)
export const ALL_MATERIALS = Object.values(MATERIALS_BY_CATEGORY).flat()
export const ALL_FINISHES = [...new Set(Object.values(FINISHES_BY_CATEGORY).flat())]

// Keep for backwards compat with any remaining imports
export const MATERIALS = ALL_MATERIALS
export const FINISHES = ALL_FINISHES
