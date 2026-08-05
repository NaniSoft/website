// The uniform per-product landing template. One shape, 21 instances: only
// the category accent (via `chrome/accents`, by `categoryId`) varies. The
// `/en/products` page renders every product through this template as an
// inline `#<slug>-detail` section — no per-product routes, no page
// transitions.
//
// Accent colour comes from the `--color-*` tokens (never a hardcoded hex, never
// the upstream vendor's brand string). Server component — the data module is the
// single source.

import type { ProductLanding } from './products-content'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { accentBandStyle, accentDotClass, accentInvertStyle, accentToken } from '@/components/chrome'

import { cn } from '@/lib/utils'

import { PRODUCT_BODY_SUFFIX } from './products-content'

// "All products" breadcrumb destination — the `/en/products` index. The only
// page that renders this template is the flat products index, so there is no
// second route to parameterize.
const BACK_HREF = '/en/products'

interface Props {
  product: ProductLanding
}

export function ProductPageTemplate({ product }: Props) {
  const accent = accentToken(product.categoryId)
  const band = accentBandStyle(product.categoryId)
  const invert = accentInvertStyle(product.categoryId)

  return (
    <div className={cn('min-h-screen', `accent-${accent}`)}>
      {/* Hero band — accent-tinted, onAccent text, category eyebrow. */}
      <header className="w-full" style={band}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-14 pt-10 sm:pb-20 sm:pt-16">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
            <a
              href={BACK_HREF}
              className="hive-focus inline-flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{ color: band.color }}
            >
              <ArrowLeft className="size-3.5" />
              All products
            </a>
            <span aria-hidden>/</span>
            <span>{product.category}</span>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            {product.name}
          </h1>
          <p className="max-w-2xl text-lg opacity-90 sm:text-xl">
            {product.line}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={product.primaryCta.href}
              className="hive-focus inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={invert}
            >
              {product.primaryCta.label}
              <ArrowRight className="size-4" />
            </a>
            {product.secondaryCta
              ? (
                  <a
                    href={product.secondaryCta.href}
                    className="hive-focus inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ borderColor: band.color, color: band.color }}
                  >
                    {product.secondaryCta.label}
                  </a>
                )
              : null}
          </div>
        </div>
      </header>

      {/* Body — feature checkmarks + a side rail. */}
      <main className="mx-auto w-full max-w-6xl px-6 py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <section>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              <span
                className={cn('size-1.5 rounded-full', accentDotClass(product.categoryId))}
                aria-hidden
              />
              What it does
            </div>
            <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
              {product.name}
              {' '}
              is part of
              {' '}
              <span style={{ color: band.background }}>{product.category}</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
              {product.line}
              {' '}
              {PRODUCT_BODY_SUFFIX}
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {product.features.map(feature => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-base text-zinc-700 dark:text-zinc-200"
                >
                  <span
                    className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full"
                    style={band}
                    aria-hidden
                  >
                    <Check className="size-3" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                Category
              </div>
              <div className="mb-4 flex items-center gap-2.5">
                <span
                  className={cn('size-2.5 rounded-full', accentDotClass(product.categoryId))}
                  aria-hidden
                />
                <span className="text-base font-semibold">{product.category}</span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {product.categoryProductCount}
                {' '}
                products in this category. Browse them below or jump back to the full suite.
              </p>
              <a
                href={BACK_HREF}
                className="hive-focus mt-5 inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: band.background }}
              >
                See the full suite
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
