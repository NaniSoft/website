import type { ReactNode } from 'react'

import { flagshipProducts } from '@/lib/products'
import { pressKitUrl, socialLinks } from '@/lib/site-config'

const currentYear = new Date().getFullYear()

const ACCENT_DOT = 'inline-block size-1.5 rounded-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-400'

interface SocialLink {
  href: string
  label: string
  icon: string
}

const socials: SocialLink[] = [
  { href: socialLinks.github, label: 'GitHub', icon: 'icon-[simple-icons--github]' },
  { href: socialLinks.linkedin ?? '', label: 'LinkedIn', icon: 'icon-[simple-icons--linkedin]' },
  { href: socialLinks.discord ?? '', label: 'Discord', icon: 'icon-[simple-icons--discord]' },
  { href: socialLinks.youtube ?? '', label: 'YouTube', icon: 'icon-[simple-icons--youtube]' },
].filter((s): s is SocialLink => Boolean(s.href))

function ColumnHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
      <span className={ACCENT_DOT} />
      {children}
    </h3>
  )
}

function FooterLink({ href, children }: { href: string, children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      {children}
    </a>
  )
}

/**
 * Nanisoft footer — flagship product links (derived from the products data
 * module so the anchors resolve), a Resources group (Press Kit, env-configured
 * and omitted when unset), a Company group (About / Blog / Changelog), and
 * env-configured social icons (any unset link omitted, never shown broken).
 * Quiet utility — the hero carries the signature; the footer just navigates.
 */
export function CustomFooter() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="lg:pe-6">
          <div className="mb-3 flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            <span className={ACCENT_DOT} />
            Nanisoft
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            The cybersecurity tools large organizations otherwise build in-house — one suite reading from a single live graph.
          </p>
          {socials.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  <span className={`${s.icon} text-lg`} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        <div>
          <ColumnHeading>Products</ColumnHeading>
          <ul className="flex flex-col gap-2">
            {flagshipProducts.map(p => (
              <li key={p.anchor}>
                <FooterLink href={p.anchor}>{p.name}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources — rendered only when the Press Kit URL is provisioned. */}
        {pressKitUrl && (
          <div>
            <ColumnHeading>Resources</ColumnHeading>
            <ul className="flex flex-col gap-2">
              <li>
                <FooterLink href={pressKitUrl}>Press Kit</FooterLink>
              </li>
            </ul>
          </div>
        )}

        {/* Company */}
        <div>
          <ColumnHeading>Company</ColumnHeading>
          <ul className="flex flex-col gap-2">
            <li><FooterLink href="/en/about">About</FooterLink></li>
            <li><FooterLink href="/en/blog">Blog</FooterLink></li>
            <li><FooterLink href="/en/changelog">Changelog</FooterLink></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-zinc-200 pt-5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        ©
        {' '}
        {currentYear}
        {' '}
        Nanisoft. All rights reserved.
      </div>
    </div>
  )
}
