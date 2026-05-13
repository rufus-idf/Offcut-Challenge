'use client'

import { useState } from 'react'

const STAR = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

const LABELS = ['', 'Poor', 'Below average', 'Average', 'Good', 'Excellent']

type Props = {
  value: number
  onChange: (rating: number) => void
}

export function StarSelector({ value, onChange }: Props) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div>
      <div
        className="flex gap-1"
        onMouseLeave={() => setHovered(0)}
        role="group"
        aria-label="Star rating"
      >
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            aria-label={`${i} star${i !== 1 ? 's' : ''}`}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHovered(i)}
            className="transition-transform hover:scale-110 focus:outline-none focus-visible:scale-110"
          >
            <svg width={36} height={36} viewBox="0 0 24 24">
              <path
                d={STAR}
                fill={i <= display ? '#f59e0b' : '#e7e5e4'}
                className="transition-colors duration-100"
              />
            </svg>
          </button>
        ))}
      </div>

      <p className="mt-1.5 h-4 text-xs text-stone-400">
        {display > 0 ? LABELS[display] : 'Click a star to rate'}
      </p>
    </div>
  )
}
