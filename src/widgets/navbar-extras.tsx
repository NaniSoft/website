'use client'

import { ProductsMegaMenu } from '@/components/NavbarMegaMenu/ProductsMegaMenu'
import ThemeToggle from '@/widgets/theme-toggle'

/**
 * Extra navbar content rendered in Nextra's `<Navbar>` children slot (after the
 * auto nav links + search). `githubUrl` is passed from the server layout (read
 * from `site-config.ts` at runtime) — this is a client component, so it cannot
 * read `process.env` directly. The GitHub icon is omitted when `githubUrl` is empty.
 */
export default function NavbarExtras({ githubUrl }: { githubUrl: string }) {
  return (
    <div className="flex items-center gap-3">
      <ProductsMegaMenu />
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <span className="icon-[ri--github-fill] text-lg" />
        </a>
      )}
      <ThemeToggle />
    </div>
  )
}
