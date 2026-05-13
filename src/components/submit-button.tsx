'use client'

import { useFormStatus } from 'react-dom'

interface SubmitButtonProps {
  children: React.ReactNode
  pendingText?: string
  className?: string
}

export function SubmitButton({ children, pendingText = 'Saving…', className }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  )
}
