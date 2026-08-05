import { ArrowRight } from 'lucide-react'

import Link from 'next/link'
import { accentDotClass, accentVar } from '@/components/chrome'
import { cn } from '@/lib/utils'

import { ProductPageTemplate } from './ProductPageTemplate'
import { productLandings, productLandingsByCategory } from './products-content'

// The full Nanisoft suite on one page — 21 products grouped by the five
// categories, each category carrying its own accent colour (via `chrome/accents`
// tokens — never a hardcoded hex). The index grid lists every product as a card
// that links to its inline `#<slug>-detail` expanded section on the SAME page
// (anchor scroll, no route transition). One uniform `ProductPageTemplate`
// renders all 21 expanded sections below the grid. `#category` and `#product`
// anchors on the grid are what the navbar mega-menu, the homepage cards, and
// the footer flagship links deep-link into.
//
// Server component: `products-content.ts` + `src/lib/products.ts` are the
// single sources of truth. No upstream-vendor brand strings, no upstream-vendor
// package imports.

const NAV_SCROLL_MARGIN = 'scroll-mt-[var(--nextra-navbar-height)]'

export function Products() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          <span className={cn('size-1.5 rounded-full', accentDotClass('core'))} aria-hidden />
          Products
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          One platform, five surfaces
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Twenty-one tools that each do one job, all reading from the same graph. Browse by
          category, or jump to a product from the navbar. Pick a card to expand its detail
          inline below.
        </p>
      </header>

      {/* Category quick-nav — jumps to each category group on the grid. */}
      <nav className="mb-12 flex flex-wrap gap-2.5">
        {productLandingsByCategory.map(category => (
          <a
            key={category.id}
            href={`#${category.id}`}
            className={cn(
              'hive-focus inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:border-zinc-600',
            )}
          >
            <span className={cn('size-2 rounded-full', accentDotClass(category.id))} aria-hidden />
            {category.name}
          </a>
        ))}
      </nav>

      {/* Index grid — 5 category groups, each product a card linking to its
          inline `#<slug>-detail` expanded section. The card's own `id={slug}`
          is the deep-link target the mega-menu / footer / homepage use. */}
      <div className="flex flex-col gap-14">
        {productLandingsByCategory.map(category => (
          <section key={category.id} id={category.id} className={NAV_SCROLL_MARGIN}>
            <div className="mb-5 flex items-center gap-2.5">
              <span className={cn('size-2.5 rounded-full', accentDotClass(category.id))} aria-hidden />
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                {category.name}
              </h2>
              <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">
                {category.products.length}
                {' '}
                products
              </span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.products.map(product => (
                <li key={product.slug}>
                  <a
                    id={product.slug}
                    href={`#${product.slug}-detail`}
                    className={cn(
                      'hive-focus group flex h-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-zinc-600',
                      NAV_SCROLL_MARGIN,
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn('size-2 rounded-full', accentDotClass(category.id))} aria-hidden />
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {product.name}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {product.line}
                    </p>
                    <span
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: accentVar(category.id) }}
                    >
                      Expand below
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-16 border-t border-zinc-200 pt-8 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <p>
          More coming. These are the first chapter of the suite —
          {' '}
          <Link href="/en/changelog" className="hive-focus underline underline-offset-4 hover:text-zinc-300">
            read the changelog
          </Link>
          {' '}
          for what shipped.
        </p>
      </footer>

      {/* Inline expanded detail — one ProductPageTemplate per product, on the
          same page. `#<slug>-detail` is the click-scroll target; the global
          `:target` rule + the explicit scroll-mt land it below the navbar. */}
      <div className="mt-4 flex flex-col">
        {productLandings.map(product => (
          <section
            key={product.slug}
            id={`${product.slug}-detail`}
            className={cn('border-t border-zinc-200 pt-14 dark:border-zinc-800', NAV_SCROLL_MARGIN)}
          >
            <ProductPageTemplate product={product} backHref="/en/products" />
          </section>
        ))}
      </div>
    </div>
  )
}
