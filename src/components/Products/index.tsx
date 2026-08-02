import Link from 'next/link'

import {
  categoryAnchor,
  categorySlug,
  productCategories,
  productSlug,
} from '@/lib/products'

const ACCENT_GRADIENT = 'bg-linear-to-r from-blue-500 via-purple-500 to-pink-400'

function AccentDot({ className = '' }: { className?: string }) {
  return <span className={`inline-block size-1.5 rounded-full ${ACCENT_GRADIENT} ${className}`} />
}

/**
 * The full Nanisoft suite on one page — 21 products grouped by the five
 * categories, with `#category` and `#product` anchors so the navbar mega-menu
 * (ticket 15) and homepage cards (ticket 17) can jump straight to a product.
 * Server component: the data module is the single source of truth.
 */
export function Products() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          <AccentDot />
          Products
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          One platform, five surfaces
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Twenty-one tools that each do one job, all reading from the same graph. Browse by
          category, or jump to a product from the navbar.
        </p>
      </header>

      {/* Category quick-nav */}
      <nav className="mb-12 flex flex-wrap gap-2.5">
        {productCategories.map(cat => (
          <a
            key={cat.id}
            href={categoryAnchor(cat)}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/50 px-3.5 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500"
          >
            <AccentDot />
            {cat.name}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-14">
        {productCategories.map(cat => (
          <section key={cat.id} id={categorySlug(cat)} className="scroll-mt-24">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              <AccentDot />
              {cat.name}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cat.products.map(product => (
                <li
                  key={product.name}
                  id={productSlug(product)}
                  className="scroll-mt-24 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 transition hover:border-zinc-600 hover:bg-zinc-900/40"
                >
                  <p className="font-medium text-zinc-100">{product.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {product.line}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-16 border-t border-zinc-800 pt-8 text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          More coming. These are the first chapter of the suite —
          {' '}
          <Link href="/en/changelog" className="underline underline-offset-4 hover:text-zinc-300">
            read the changelog
          </Link>
          {' '}
          for what shipped.
        </p>
      </footer>
    </div>
  )
}
