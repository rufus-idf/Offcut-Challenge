// Display-only star rating — safe as a Server Component

const STAR = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

type Props = {
  rating: number      // 0–5; decimals shown as nearest integer for simplicity
  count?: number      // if provided, renders "(N reviews)" label
  size?: 'sm' | 'md'
}

export function StarRating({ rating, count, size = 'md' }: Props) {
  const px   = size === 'sm' ? 14 : 18
  const filled = Math.round(rating)

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} width={px} height={px} viewBox="0 0 24 24" aria-hidden>
            <path d={STAR} fill={i <= filled ? '#f59e0b' : '#e7e5e4'} />
          </svg>
        ))}
      </div>

      {count !== undefined && (
        <span className={`text-stone-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {rating.toFixed(1)} · {count} review{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
