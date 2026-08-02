'use client'

// Products mega-menu for the Nextra navbar. Grouped by the five categories from
// the products data module (single source of truth) — category headers link to
// `/en/products#<categorySlug>`, products to `/en/products#<productSlug>`.
// Visible in the top bar on all viewports: the panel is a grid on desktop and a
// stacked list on mobile, so the mega-menu is usable on mobile without DOM-coupled
// injection into Nextra's mobile slide-out (which would break on Nextra upgrades).

import { useEffect, useId, useRef, useState } from 'react'
import { megaMenuGroups } from '@/lib/products'

const ACCENT_DOT = 'inline-block size-1.5 rounded-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-400'

export function ProductsMegaMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // Close on click-outside + Esc. Hover opens/closes on desktop.
  useEffect(() => {
    if (!open) {
      return
    }
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      ref={ref}
      className="relative"
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) {
          setOpen(false)
        }
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(open => !open)}
        className="inline-flex items-center gap-1 text-sm whitespace-nowrap text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Products
        <span className={`icon-[ri--arrow-down-s-line] size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[min(90vw,56rem)] rounded-xl border border-zinc-800 bg-zinc-900/95 p-5 shadow-xl backdrop-blur-md dark:bg-zinc-950/95"
        >
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {megaMenuGroups.map(group => (
              <div key={group.name}>
                <a
                  href={group.anchor}
                  role="menuitem"
                  className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 transition-colors hover:text-white"
                >
                  <span className={ACCENT_DOT} />
                  {group.name}
                </a>
                <ul className="space-y-1">
                  {group.products.map(p => (
                    <li key={p.anchor}>
                      <a
                        href={p.anchor}
                        role="menuitem"
                        className="block rounded-md px-2 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
                      >
                        {p.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
