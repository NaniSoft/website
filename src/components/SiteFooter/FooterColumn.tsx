'use client'

// A footer link column — a native `<details>`/`<summary>` accordion that is
// force-open on desktop (≥ `lg` / 64rem) and user-toggled on mobile.
//
// The `open` attribute is driven by a `matchMedia` listener because a closed
// `<details>` hides its content from the accessibility tree *even when CSS
// makes it visible* — the `@media (min-width: 64rem)` force-visible rule in
// index.css is only a no-JS / pre-hydration fallback for sighted users; without
// this effect the desktop column would be invisible to screen readers. On
// mobile the column starts collapsed and the user expands it; the height +
// opacity transition itself is CSS (`.col-content` in index.css).

import { useEffect, useState } from 'react'

export interface FooterLink {
  label: string
  href: string
}

export function FooterColumn({ heading, links }: { heading: string, links: FooterLink[] }) {
  const [open, setOpen] = useState(false)
  const [desktop, setDesktop] = useState(false)

  useEffect(() => {
    // jsdom (unit tests) has no matchMedia — guard so the effect is a no-op
    // there and the column renders closed (jsdom still exposes closed-`<details>`
    // content, so the link assertions find it).
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mq = window.matchMedia('(min-width: 64rem)')
    const sync = () => {
      setDesktop(mq.matches)
      setOpen(mq.matches)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return (
    <details
      // Force-open on desktop; on mobile follow the user's toggle.
      open={open || desktop}
      onToggle={e => setOpen(e.currentTarget.open)}
      className="group"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 lg:cursor-default [&::-webkit-details-marker]:hidden">
        {heading}
        <span
          aria-hidden
          className="ml-auto text-zinc-400 transition-transform duration-200 group-open:rotate-180 lg:hidden"
        >
          ▾
        </span>
      </summary>
      <div className="col-content">
        <ul className="flex flex-col gap-2 pt-2 lg:pt-3">
          {links.map(l => (
            <li key={`${l.href}-${l.label}`}>
              <a
                href={l.href}
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}
