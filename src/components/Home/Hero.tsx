'use client'

// Homepage hero — variant A (tabs over a split hero). A tab strip with accent
// dots + a bottom-border highlight on the active tab sits above a split hero
// (heading / description / CTA on the left, an illustration placeholder on the
// right); `framer-motion` cross-fades the panel on tab change. The 5 tabs are
// the 5 product categories. Query & Traversal is pinned as the gateway slot —
// its illustration placeholder renders the dark `--color-qt-dark` tile and it
// carries a primary plus a secondary CTA, so the flagship entry point stands
// out. The gateway is the default active tab.
//
// Accent colour comes from the `--color-*` tokens via `chrome/accents` — never
// a hardcoded hex. The illustration is a same-size placeholder (real assets are
// a later, out-of-scope effort).

import type { CSSProperties, ReactNode } from 'react'

import type { CategoryHero } from './home-content'

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { accentDotClass, accentForegroundVar, accentVar } from '@/components/chrome'
import { categoryAnchor } from '@/lib/products'

import { cn } from '@/lib/utils'
import { categoryHeroes } from './home-content'

const GATEWAY_INDEX = categoryHeroes.findIndex(hero => hero.gateway)

/** `/en/products#<category>` anchor for a hero CTA. */
function categoryHref(hero: CategoryHero): string {
  return categoryAnchor({ name: hero.name })
}

function HeroCta({
  href,
  children,
  style,
  className,
}: {
  href: string
  children: ReactNode
  style?: CSSProperties
  className?: string
}) {
  return (
    <a
      href={href}
      style={style}
      className={cn(
        'hive-focus inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5',
        className,
      )}
    >
      {children}
    </a>
  )
}

/** Same-size placeholder for the hero illustration. The gateway renders the dark tile. */
function IllustrationPlaceholder({ hero }: { hero: CategoryHero }) {
  const dark = hero.gateway
  return (
    <div
      className="flex h-[420px] items-center justify-center rounded-3xl border lg:h-[440px]"
      style={{
        background: dark ? 'var(--color-qt-dark)' : accentVar(hero.id),
        borderColor: dark ? 'color-mix(in srgb, var(--color-qt-dark) 85%, var(--color-qt-foreground))' : 'transparent',
      }}
      aria-hidden
    >
      <span
        className="text-xs font-medium uppercase tracking-[0.18em]"
        style={{ color: dark ? 'color-mix(in srgb, var(--color-qt-foreground) 60%, transparent)' : accentForegroundVar(hero.id) }}
      >
        Illustration placeholder
      </span>
    </div>
  )
}

export function Hero() {
  // The gateway (Query & Traversal) is the default active tab — the flagship
  // entry point stands out on load.
  const [active, setActive] = useState(GATEWAY_INDEX)
  const current = categoryHeroes[active]

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-14 pt-16 lg:pb-20 lg:pt-24">
      <div
        role="tablist"
        aria-label="Product categories"
        className="mb-8 flex gap-8 text-sm font-medium max-lg:justify-center lg:mb-12 lg:text-lg"
      >
        {categoryHeroes.map((hero, index) => {
          const isActive = active === index
          return (
            <button
              key={hero.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(index)}
              data-accent={hero.id}
              className={cn(
                'hive-focus flex items-center gap-2.5 border-b-2 pb-2.5 transition-colors lg:pb-3.5',
                isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-500',
              )}
              style={{ borderColor: isActive ? accentVar(hero.id) : 'transparent' }}
            >
              <span
                className={cn('size-2 rounded-full', accentDotClass(hero.id))}
                aria-hidden
              />
              {hero.name}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-12 lg:gap-20">
        <div className="flex-1 max-lg:w-full max-lg:text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              role="tabpanel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="mb-4 text-3xl/snug font-medium lg:text-[3.25rem]/tight">
                {current.heading}
              </h1>
              <p className="mb-8 max-w-lg text-lg text-zinc-600 lg:mb-10 dark:text-zinc-300">
                {current.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 max-lg:justify-center">
                <HeroCta
                  href={categoryHref(current)}
                  style={{ background: accentVar(current.id), color: accentForegroundVar(current.id) }}
                >
                  {current.cta}
                </HeroCta>
                {current.secondaryCta && (
                  <HeroCta
                    href={categoryHref(current)}
                    className="bg-zinc-200 text-zinc-900 dark:bg-white/10 dark:text-white"
                  >
                    {current.secondaryCta}
                  </HeroCta>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="max-lg:hidden lg:w-[55%]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <IllustrationPlaceholder hero={current} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
