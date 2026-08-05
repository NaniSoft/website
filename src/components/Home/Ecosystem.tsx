// Homepage ecosystem — the whole suite graspable at a glance and drillable.
// One collapsible `<details>` per category, open by default; each expands to a
// 2-column product grid with anchor links into `/en/products#<slug>`. Native
// `<details>`/`<summary>` (no Radix accordion — the dependency-surface decision
// in ticket 08). The open/close height+opacity transition is CSS, per the
// ticket 11 polish spec. Per-category accent comes from the `--color-*` tokens
// via `chrome/accents` — never a hardcoded hex.

import { accentDotClass, SectionLabel } from '@/components/chrome'
import { totalProductCount } from '@/lib/products'
import { cn } from '@/lib/utils'

import { categoryHeroes } from './home-content'

export function Ecosystem() {
  const total = totalProductCount()
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14">
      <SectionLabel>
        The suite —
        {total}
        {' '}
        products, one graph
      </SectionLabel>
      <h2 className="mb-8 text-2xl font-medium tracking-tight sm:text-3xl">
        One suite where point tools leave seams
      </h2>
      <div className="flex flex-wrap gap-3">
        {categoryHeroes.map(hero => (
          <details
            key={hero.id}
            open
            className="group min-w-[280px] flex-1 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <summary
              className={cn(
                'hive-focus flex cursor-pointer list-none items-center gap-2.5 text-base font-medium',
                '[&::-webkit-details-marker]:hidden',
              )}
            >
              <span
                className={cn('size-2.5 rounded-full', accentDotClass(hero.id))}
                aria-hidden
              />
              {hero.name}
              <span className="ml-auto text-xs font-normal text-zinc-500 dark:text-zinc-400">
                {hero.products.length}
                {' '}
                products
              </span>
              <span
                className="text-zinc-500 transition-transform group-open:rotate-180"
                aria-hidden
              >
                ▾
              </span>
            </summary>
            <ul className="mt-4 grid grid-cols-2 gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
              {hero.products.map(product => (
                <li key={product.name}>
                  <a
                    href={product.anchor}
                    data-accent={hero.id}
                    className="hive-focus block rounded px-1 py-0.5 transition-colors hover:text-zinc-900 dark:hover:text-white"
                  >
                    {product.name}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  )
}
