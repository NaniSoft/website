import type { ReactNode } from 'react'

interface TopBarProps {
  /** Small message rendered next to the brand mark. */
  message?: string
  /** Right-hand content (e.g. quick nav links). */
  children?: ReactNode
}

/**
 * Slim brand bar — a brand mark (lime square + "Nanisoft") plus an optional
 * message and optional right-hand content. Sits at the very top of a surface
 * to anchor it in the site chrome. Decorative only; the real navbar lives in
 * the Nextra shell.
 */
export function TopBar({ message, children }: TopBarProps) {
  return (
    <div className="border-b border-beige-300 bg-beige-100 dark:border-neutral-800 dark:bg-dark">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-6 py-2 text-xs text-beige-800 dark:text-beige-300">
        <a
          href="/en"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span className="inline-block size-2.5 rounded-sm bg-primary" aria-hidden />
          <span>Nanisoft</span>
        </a>
        {message && (
          <>
            <span className="text-beige-400" aria-hidden>·</span>
            <span>{message}</span>
          </>
        )}
        {children && <div className="ml-auto flex items-center gap-3">{children}</div>}
      </div>
    </div>
  )
}
