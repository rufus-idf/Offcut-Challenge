// Pure SVG component — no browser APIs, safe as a Server Component

const SHAPE_LABELS: Record<string, string> = {
  RECT: 'Rectangle',
  L:    'L-shape',
  C:    'C-shape',
  POLY: 'Polygon',
}

type Props = {
  shapeType: string
  verticesMm?: number[][] | null
  lengthMm?: number | null
  widthMm?: number | null
  thicknessMm: number
  bboxWMm?: number | null
  bboxHMm?: number | null
  showLabels?: boolean
  className?: string
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function ShapePreview({
  shapeType,
  verticesMm,
  lengthMm,
  widthMm,
  thicknessMm,
  bboxWMm,
  bboxHMm,
  showLabels = false,
  className = '',
}: Props) {
  // Build vertex list — camera provides real coords, manual entries use length/width
  let verts: [number, number][]
  if (verticesMm && verticesMm.length >= 3) {
    verts = verticesMm as [number, number][]
  } else {
    const w = lengthMm ?? bboxWMm ?? 100
    const h = widthMm ?? bboxHMm ?? 60
    verts = [[0, 0], [w, 0], [w, h], [0, h]]
  }

  // Bounding box → scale to fit the SVG viewport with padding
  const xs = verts.map(v => v[0])
  const ys = verts.map(v => v[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const shapeW = Math.max(...xs) - minX
  const shapeH = Math.max(...ys) - minY

  const PAD  = showLabels ? 38 : 6
  const VIEW_W = showLabels ? 260 : 80
  const VIEW_H = showLabels ? 200 : 60

  const scale = Math.min(
    (VIEW_W - PAD * 2) / shapeW,
    (VIEW_H - PAD * 2) / shapeH,
  )

  // Translate + scale to SVG space, centre the shape
  const scaledW = shapeW * scale
  const scaledH = shapeH * scale
  const offsetX = (VIEW_W - scaledW) / 2
  const offsetY = (VIEW_H - scaledH) / 2

  const sv = (verts: [number, number][]) =>
    verts.map(([x, y]) => [
      offsetX + (x - minX) * scale,
      offsetY + (y - minY) * scale,
    ] as [number, number])

  const scaled = sv(verts)
  const points = scaled.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  // Centroid — used to push labels outward from the shape
  const cx = scaled.reduce((s, v) => s + v[0], 0) / scaled.length
  const cy = scaled.reduce((s, v) => s + v[1], 0) / scaled.length

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      style={{ width: '100%', height: '100%' }}
      aria-label={`${SHAPE_LABELS[shapeType] ?? shapeType} offcut`}
    >
      <polygon
        points={points}
        fill="#fef9ee"
        stroke="#b45309"
        strokeWidth={showLabels ? 1.5 : 1}
        strokeLinejoin="round"
      />

      {showLabels && scaled.map(([x1, y1], i) => {
        const [x2, y2] = scaled[(i + 1) % scaled.length]
        const [rx1, ry1] = verts[i]
        const [rx2, ry2] = verts[(i + 1) % verts.length]
        const realLen = dist(rx1, ry1, rx2, ry2)

        // Edge midpoint
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2

        // Push label outward from centroid
        const dx = mx - cx
        const dy = my - cy
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        const labelX = mx + (dx / d) * 14
        const labelY = my + (dy / d) * 14

        // Rotate text to match edge angle (keep text upright)
        let angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
        if (angle > 90 || angle < -90) angle += 180

        return (
          <g key={i}>
            {/* Tick marks at each end of the edge */}
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#d97706" strokeWidth={0.5} strokeDasharray="none" opacity={0.4}
            />
            <text
              x={labelX}
              y={labelY}
              transform={`rotate(${angle.toFixed(1)},${labelX.toFixed(1)},${labelY.toFixed(1)})`}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fontFamily="ui-monospace, monospace"
              fill="#44403c"
            >
              {Math.round(realLen)}mm
            </text>
          </g>
        )
      })}

      {/* Thickness label — bottom right corner */}
      {showLabels && (
        <text
          x={VIEW_W - 4} y={VIEW_H - 4}
          textAnchor="end"
          fontSize={8}
          fontFamily="ui-monospace, monospace"
          fill="#a8a29e"
        >
          {thicknessMm}mm thick
        </text>
      )}
    </svg>
  )
}

export { SHAPE_LABELS }
