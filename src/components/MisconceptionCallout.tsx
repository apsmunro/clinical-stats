/**
 * MisconceptionCallout — styled callout box for common traps.
 * Variants: 'misconception' (amber warning, default), 'lens' (reviewer's-lens
 * blue), 'note' (neutral key point / pull-quote).
 */
import type { ReactNode } from 'react'

export interface MisconceptionCalloutProps {
  title: string
  children: ReactNode
  variant?: 'misconception' | 'lens' | 'note'
}

const ICONS: Record<string, string> = {
  misconception: '⚠️',
  lens: '🔍',
  note: '📌',
}

export function MisconceptionCallout({ title, children, variant = 'misconception' }: MisconceptionCalloutProps) {
  return (
    <aside className={`callout callout--${variant}`} role="note">
      <div className="callout__title">
        <span aria-hidden="true">{ICONS[variant]}</span> {title}
      </div>
      <div className="callout__body">{children}</div>
    </aside>
  )
}
