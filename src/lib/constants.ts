export const MATERIALS = [
  'MDF',
  'Plywood',
  'Chipboard',
  'Oak',
  'Birch ply',
  'Pine',
  'Walnut',
  'Beech',
] as const

export const FINISHES = [
  'Raw / unfinished',
  'White melamine',
  'Oak veneer',
  'Walnut veneer',
  'Black melamine',
  'Birch faced',
  'Pre-primed',
  'Laminated',
] as const

export type Material = (typeof MATERIALS)[number]
export type Finish = (typeof FINISHES)[number]
