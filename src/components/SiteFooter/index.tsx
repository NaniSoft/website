import type { FooterLink } from './FooterColumn'
import { flagshipProducts } from '@/lib/products'
import { pressKitUrl, socialLinks } from '@/lib/site-config'
import { FooterColumn } from './FooterColumn'

// The Nanisoft footer — the chosen 4-column composition (variant A of the
// chrome prototype): brand + socials | flagship products | resources |
// company, with a `© <year> Nanisoft` bottom row. Social links are env-driven
// (any unset link is omitted, never shown broken); the Press Kit link is
// appended to Resources only when its env URL is provisioned. On mobile the
// three link columns collapse into native <details>/`<summary>` accordions
// (height + opacity transition via the `grid-rows-[0fr]`→`[1fr]` trick, 200ms;
// forced open on `lg:` so desktop always shows the full column).

// Hoisted to module scope so the copyright year is computed once, not on every
// render (react/purity rule).
const COPYRIGHT_YEAR = new Date().getFullYear()

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

const resourceLinks: FooterLink[] = [
  { label: 'Documentation', href: '/en/docs' },
  { label: 'Blog', href: '/en/blog' },
  { label: 'Changelog', href: '/en/changelog' },
  // Press Kit is appended only when the env URL is provisioned.
  ...(pressKitUrl ? [{ label: 'Press Kit', href: pressKitUrl }] : []),
]

const companyLinks: FooterLink[] = [
  { label: 'About', href: '/en/about' },
  { label: 'Contact', href: '/en/contact' },
]

const productLinks: FooterLink[] = flagshipProducts.map(p => ({
  label: p.name,
  href: p.anchor,
}))

function BrandMark() {
  return (
    <a
      href="/en"
      className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground"
    >
      <span className="inline-block size-2.5 rounded-sm bg-primary" aria-hidden />
      <span>Nanisoft</span>
    </a>
  )
}

/**
 * Nanisoft site footer. Replaces the upstream `CustomFooter` functionally; the
 * old file is deleted in a later cleanup ticket (expand-contract — new lands
 * beside old, old is removed once unreferenced).
 */
export function SiteFooter() {
  return (
    <footer className="site-footer border-t border-zinc-200 bg-background dark:border-zinc-800">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:gap-10 lg:grid-cols-4">
        {/* Brand + socials */}
        <div className="lg:pe-6">
          <BrandMark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            21 products, one graph. Cybersecurity tools for organizations that would otherwise
            build them in-house.
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

        {/* Products — flagship six */}
        <FooterColumn heading="Products" links={productLinks} />

        {/* Resources — Press Kit appended when provisioned */}
        <FooterColumn heading="Resources" links={resourceLinks} />

        {/* Company */}
        <FooterColumn heading="Company" links={companyLinks} />
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 text-xs text-zinc-500 dark:text-zinc-500">
          <span>
            ©
            {' '}
            {COPYRIGHT_YEAR}
            {' '}
            Nanisoft
          </span>
          <span className="hidden sm:inline">Built on the live attack-path graph.</span>
        </div>
      </div>
    </footer>
  )
}
