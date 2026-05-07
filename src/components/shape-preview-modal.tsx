'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShapePreview, SHAPE_LABELS } from './shape-preview'

type Props = {
  shapeType: string
  verticesMm?: number[][] | null
  lengthMm?: number | null
  widthMm?: number | null
  thicknessMm: number
  bboxWMm?: number | null
  bboxHMm?: number | null
  thumbnailShowLabels?: boolean
  thumbnailClassName?: string
}

export function ShapePreviewModal({
  thumbnailShowLabels = false,
  thumbnailClassName = 'h-full w-full',
  ...shapeProps
}: Props) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const label = SHAPE_LABELS[shapeProps.shapeType] ?? shapeProps.shapeType

  return (
    <>
      {/* Clickable thumbnail */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${thumbnailClassName} cursor-zoom-in`}
        aria-label={`Click to enlarge ${label} shape preview`}
      >
        <ShapePreview {...shapeProps} showLabels={thumbnailShowLabels} />
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900">{label}</h3>
                <p className="text-xs text-stone-400">
                  {shapeProps.thicknessMm}mm thick
                  {shapeProps.lengthMm && shapeProps.widthMm
                    ? ` · ${shapeProps.lengthMm} × ${shapeProps.widthMm}mm`
                    : shapeProps.bboxWMm && shapeProps.bboxHMm
                      ? ` · ${Math.round(shapeProps.bboxWMm)} × ${Math.round(shapeProps.bboxHMm)}mm`
                      : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Full-size labelled diagram */}
            <div className="h-80 w-full">
              <ShapePreview {...shapeProps} showLabels={true} />
            </div>

            <p className="mt-4 text-center text-xs text-stone-400">
              Press Esc or click outside to close
            </p>
          </div>
        </div>
      )}
    </>
  )
}
