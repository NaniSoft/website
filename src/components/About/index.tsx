import Link from 'next/link'

import { SectionLabel } from '@/components/chrome'

// /en/about — the origin story wrapped in the shared site chrome (variant A
// editorial, impl ticket 07). A two-column layout: the prose on the left (the
// honest "why we built this" story, no fabricated people or metrics), and a
// quick-facts aside on the right carrying the two verifiable counts (5
// categories, 21 products) plus a link to the changelog — the honest record of
// what shipped. Server component — no client runtime. Links inherit the
// global `.hive-focus` ring; the page renders at `theme.layout: 'full'` so
// the Nextra docs sidebar does not compete with this layout.

const QUICK_FACTS = [
  { label: 'Categories', value: '5' },
  { label: 'Products', value: '21' },
] as const

export function About() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <SectionLabel>About</SectionLabel>
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-start">
        <article className="max-w-prose">
          <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
            About
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
            Nanisoft builds the cybersecurity tools that large organizations otherwise build
            in-house. Enterprise security suites cover the foundations — authentication,
            authorization, endpoint, VPN, network security — and then every gap they leave
            becomes a custom integration, an internal tool, or a team that holds the answer in
            their heads.
          </p>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            That work is expensive to build and fragile to keep. Nanisoft replaces it with one
            cohesive suite that reads from a single live graph of every path into a system, so
            the route an attacker would take is visible before they take it.
          </p>
          <blockquote className="mt-8 border-l-2 border-primary pl-4 text-base italic text-zinc-500 dark:text-zinc-400">
            More on the team and the company is coming. For now, the
            {' '}
            <Link href="/en/changelog" className="font-medium not-italic underline-offset-4 hover:underline">
              changelog
            </Link>
            {' '}
            is the honest record of what shipped.
          </blockquote>
        </article>

        <aside className="rounded-2xl border border-beige-300 p-5 text-sm text-zinc-600 dark:border-neutral-800 dark:text-zinc-400">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Quick facts
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {QUICK_FACTS.map(fact => (
              <div key={fact.label}>
                <dt className="text-xs text-zinc-500 dark:text-zinc-500">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-beige-300 pt-4 dark:border-neutral-800">
            <Link
              href="/en/changelog"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Read the changelog →
            </Link>
          </div>
        </aside>
      </div>
    </section>
  )
}
