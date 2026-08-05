import Link from 'next/link'

import { NotFoundPage } from 'nextra-theme-docs'

// 404 — a way forward, not a dead-end (impl ticket 07). Wraps Nextra's
// `NotFoundPage` (which renders the page inside the shell and appends a
// "submit an issue" link to the repo) with custom children: a large lime
// 4-0-4, a plain-language explanation, and two outgoing CTAs (home + blog)
// so a broken link never strands the visitor. Links inherit the global
// `.hive-focus` ring; `NotFoundPage` already sizes the page to clear the
// sticky navbar via `--nextra-navbar-height`. Server component — no client
// runtime beyond what `NotFoundPage` itself mounts.

export function NotFound() {
  return (
    <NotFoundPage>
      <div className="text-center">
        <div className="mx-auto mb-6 inline-flex items-baseline justify-center gap-3 font-mono text-[120px] leading-none font-medium tracking-tight text-primary">
          4
          <span className="text-zinc-300 dark:text-zinc-700">0</span>
          4
        </div>
        <h1 className="text-2xl font-medium tracking-tight">
          Not here.
        </h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          The page you tried to reach has moved, been renamed, or never existed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/en"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to home
          </Link>
          <Link
            href="/en/blog"
            className="rounded-full border border-beige-300 px-5 py-2 text-sm font-medium text-foreground dark:border-neutral-800"
          >
            Read the blog
          </Link>
        </div>
      </div>
    </NotFoundPage>
  )
}
