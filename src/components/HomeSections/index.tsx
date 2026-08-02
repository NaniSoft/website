import type { ReactNode } from 'react'

import { ContactForm } from '@/components/ContactForm'
import { allBlogs, formatDate, postUrl } from '@/lib/blog'
import { productAnchor, productCategories, totalProductCount } from '@/lib/products'

// Homepage sections rendered below the hero. The hero carries the signature
// (graph + particles); these sections are quiet, plain-background, single
// `max-w-5xl` column work. The accent gradient (blue → purple → pink) appears
// only as dots and a clipped headline — never as a wash. No particles here.

// The blue→purple→pink signature gradient. Used as a dot (one or three
// inline spans), as the headline text clip, and as a 1-pixel mark inside the
// services checklist — all of those should converge on the same gradient, so
// the class list is the single source here.
const ACCENT_GRADIENT = 'bg-linear-to-r from-blue-500 via-purple-500 to-pink-400'
const ACCENT_DOT
  = `inline-block size-1.5 rounded-full ${ACCENT_GRADIENT}`
const ACCENT_TEXT
  = `${ACCENT_GRADIENT} bg-clip-text text-transparent`

const INDUSTRIES = [
  'Financial Services',
  'Healthcare',
  'Critical Infrastructure',
  'Government',
  'Retail',
] as const

interface Service {
  name: string
  line: string
  checks: readonly string[]
}

const SERVICES: readonly Service[] = [
  {
    name: 'Assessment',
    line: 'We map your environment and rank the paths that matter.',
    checks: ['Attack-path survey', 'Tooling gap analysis', 'Prioritized roadmap'],
  },
  {
    name: 'Implementation',
    line: 'We deploy the suite against your live graph and tune it to your teams.',
    checks: ['Atlas rollout', 'Bedrock + Keystone integration', 'Runbook handoff'],
  },
  {
    name: 'Managed Operation',
    line: 'We run the suite so your team does not have to staff it.',
    checks: ['24/7 monitoring', 'Weekly attack-path review', 'Quarterly tuning'],
  },
  {
    name: 'Open Source Support',
    line: 'We maintain the open source core and back your internal use.',
    checks: ['Upstream maintenance', 'CVE response', 'SLA-backed support'],
  },
] as const

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
      <span className={ACCENT_DOT} />
      {children}
    </div>
  )
}

/**
 * Trust strip — industry-segment badges. No fabricated logos: the industries
 * are named as text because that is the honest version of "trusted by".
 */
export function TrustStrip() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-4">
      <Eyebrow>Built for teams in environments like these</Eyebrow>
      <div className="flex flex-wrap gap-2.5">
        {INDUSTRIES.map(industry => (
          <span
            key={industry}
            className="inline-flex items-center rounded-full border border-zinc-200 px-3.5 py-1.5 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
          >
            {industry}
          </span>
        ))}
      </div>
    </section>
  )
}

/**
 * Products grid — 5 collapsible `<details>` (one per category). Cards link to
 * `/en/products#<slug>`. The first category is open so the depth is obvious at
 * a glance; the rest collapse to keep the column scannable.
 */
export function ProductsGrid() {
  const total = totalProductCount()
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Eyebrow>
        The suite —
        {total}
        {' '}
        products, one graph
      </Eyebrow>
      <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
        One suite where point tools leave seams
      </h2>
      <div className="flex flex-col gap-3">
        {productCategories.map((category, index) => (
          <details
            key={category.id}
            open={index === 0}
            className="group rounded-xl border border-zinc-200 bg-zinc-50/40 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/30"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              <span className="flex items-center gap-2.5">
                <span className={ACCENT_DOT} />
                {category.name}
              </span>
              <span className="flex items-center gap-3 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                {category.products.length}
                {' '}
                products
                <span
                  className="icon-[ri--arrow-down-s-line] size-4 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </span>
            </summary>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.products.map(product => (
                <li key={product.name}>
                  <a
                    href={productAnchor(product)}
                    className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                  >
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {product.name}
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {product.line}
                    </div>
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

/**
 * Services — 4 cards (Assessment / Implementation / Managed Operation / Open
 * Source Support). Name + one line + a short checklist of what each covers.
 */
export function Services() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Eyebrow>How we work with you</Eyebrow>
      <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
        Services around the suite
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map(service => (
          <div
            key={service.name}
            className="flex flex-col rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className={ACCENT_DOT} />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {service.name}
              </h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {service.line}
            </p>
            <ul className="mt-auto flex flex-col gap-1.5">
              {service.checks.map(check => (
                <li
                  key={check}
                  className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                >
                  <span className={`mt-1.5 size-1 shrink-0 rounded-full ${ACCENT_GRADIENT}`} aria-hidden />
                  {check}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * Get in touch — rounded panel: heading + copy on one side, the contact form
 * (ticket 13) on the other. The `#get-in-touch` anchor is what the navbar
 * "Contact" link points at.
 */
export function GetInTouch() {
  return (
    <section id="get-in-touch" className="mx-auto max-w-5xl px-6 py-16">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="grid lg:grid-cols-2">
          <div className="border-b border-zinc-200 p-8 lg:border-b-0 lg:border-r dark:border-zinc-800">
            <Eyebrow>Get in touch</Eyebrow>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
              See your own
              {' '}
              <span className={ACCENT_TEXT}>attack paths</span>
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Tell us what you are trying to see. We will walk you through how
              Atlas maps the routes through your systems — and what it would
              take to run the suite against your live graph.
            </p>
          </div>
          <div className="bg-zinc-50/40 p-8 dark:bg-zinc-900/30">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Recommended reading — the 4 most recent posts (`allBlogs.slice(0, 4)`) as
 * link cards. Reverse-chronological order is already guaranteed by `allBlogs`.
 */
export function RecommendedReading() {
  const posts = allBlogs.slice(0, 4)
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Eyebrow>Recommended reading</Eyebrow>
      <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
        From the blog
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map(post => (
          <a
            key={post.slug}
            href={postUrl(post)}
            className="group block rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(post.date)}
            </div>
            <h3 className="mt-2 text-base font-semibold text-zinc-900 transition-colors group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-300">
              {post.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {post.description}
            </p>
          </a>
        ))}
      </div>
    </section>
  )
}
