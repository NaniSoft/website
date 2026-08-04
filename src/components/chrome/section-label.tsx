import type { ReactNode } from 'react'

import type { CategoryId } from './accents'
import { accentDotClass } from './accents'

interface SectionLabelProps {
  /** The eyebrow text. */
  children: ReactNode
  /** Category accent for the dot; defaults to the mode-tuned lime primary. */
  category?: CategoryId
  className?: string
}

/**
 * Eyebrow label — a small dot plus an uppercase, tracked label. The dot carries
 * the category accent (or the lime primary by default). Used by every surface
 * to label a section consistently. Design rule: the dot is the accent, the
 * label text stays ink/zinc (no inline small accent text on the shared bg).
 */
export function SectionLabel({ children, category, className = '' }: SectionLabelProps) {
  const dotClass = category ? accentDotClass(category) : 'bg-primary'
  return (
    <div
      className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      <span
        className={`size-1.5 rounded-full ${dotClass}`}
        data-accent={category ?? 'primary'}
        aria-hidden
      />
      {children}
    </div>
  )
}
