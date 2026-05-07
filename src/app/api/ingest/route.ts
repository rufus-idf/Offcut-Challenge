import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { MATERIALS_BY_CATEGORY, type Category } from '@/lib/constants'

function deriveCategoryFromMaterial(material: string): Category {
  for (const [category, materials] of Object.entries(MATERIALS_BY_CATEGORY)) {
    if ((materials as readonly string[]).includes(material)) {
      return category as Category
    }
  }
  return 'Other'
}

export async function POST(request: NextRequest) {
  // Authenticate via Bearer token (the workshop's API key)
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 })
  }
  const apiKey = authHeader.slice(7).trim()

  // Service client bypasses RLS — needed because the camera is not a Supabase user
  const supabase = createServiceClient()

  const { data: keyRow } = await supabase
    .from('workshop_api_keys')
    .select('workshop_id')
    .eq('api_key', apiKey)
    .single()

  if (!keyRow) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const material = (body.material as string | undefined) ?? 'Unknown'
  const category = deriveCategoryFromMaterial(material)

  // Camera reports thickness as P95 height above bed — round to nearest mm
  const thicknessMm = body.height_mm_above_bed_p95
    ? Math.round(body.height_mm_above_bed_p95 as number)
    : typeof body.thickness_mm === 'number'
      ? Math.round(body.thickness_mm)
      : null

  if (!thicknessMm) {
    return NextResponse.json({ error: 'thickness_mm or height_mm_above_bed_p95 is required' }, { status: 400 })
  }

  const shapeType = (body.shape_type as string | undefined) ?? 'RECT'
  const bboxW = body.bbox_w_mm as number | undefined
  const bboxH = body.bbox_h_mm as number | undefined

  const { data, error } = await supabase
    .from('stock_items')
    .insert({
      workshop_id:   keyRow.workshop_id,
      source:        'camera',
      shape_type:    shapeType,
      category,
      material,
      finish:        null,  // Unknown at scan time — set by workshop before publishing
      length_mm:     shapeType === 'RECT' && bboxW ? Math.round(bboxW) : null,
      width_mm:      shapeType === 'RECT' && bboxH ? Math.round(bboxH) : null,
      thickness_mm:  thicknessMm,
      bbox_w_mm:     bboxW ?? null,
      bbox_h_mm:     bboxH ?? null,
      area_mm2:      (body.area_mm2 as number | undefined) ?? null,
      vertices_mm:   (body.vertices_mm as unknown[][] | undefined) ?? null,
      svg_path_data: (body.svg_path_data as string | undefined) ?? null,
      quantity:      (body.qty as number | undefined) ?? (body.quantity as number | undefined) ?? 1,
      notes:         (body.notes as string | undefined) ?? null,
      status:        'available',
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    stock_item_id: data.id,
    message: `${material} offcut (${shapeType}) added to stock`,
  })
}
