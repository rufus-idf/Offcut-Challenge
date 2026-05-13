'use client'

import { useState, useTransition } from 'react'

interface Props {
  action: (formData: FormData) => Promise<void>
  label: string
  className?: string
  pendingText?: string
}

export function ConfirmButton({ action, label, className, pendingText = '…' }: Props) {
  const [phase, setPhase] = useState<'idle' | 'confirm'>('idle')
  const [isPending, startTransition] = useTransition()

  if (phase === 'confirm') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className="text-stone-400">Sure?</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => action(new FormData()))}
          className="font-semibold text-red-600 hover:underline disabled:opacity-40"
        >
          {isPending ? pendingText : 'Yes'}
        </button>
        <button
          type="button"
          onClick={() => setPhase('idle')}
          className="text-stone-400 hover:text-stone-700"
        >
          No
        </button>
      </span>
    )
  }

  return (
    <button type="button" onClick={() => setPhase('confirm')} className={className}>
      {label}
    </button>
  )
}
