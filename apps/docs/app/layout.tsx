import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'
import { Layout } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import { crossNavLinks } from '@nanisoft/identity'
import DocsNavbar, { SELF_ORIGIN } from './docs-navbar'
// The docs theme's stylesheet — WITHOUT this import the entire Nextra theme
// CSS is missing from the build and the site ships as unstyled HTML (the app
// CSS bundle then contains only the Satoshi @font-face rules). Mirrors
// apps/blog/app/layout.tsx, which imports 'nextra-theme-blog/style.css'.
// Must precede ./globals.css so the brand overlay wins same-specificity ties.
import 'nextra-theme-docs/style.css'
import './globals.css'

// Satoshi is the voice face (UI/body/headings). Mirrors the landing's font set:
// Regular, Italic, Medium, Bold, BoldItalic. `variable` exposes --font-satoshi
// on <html> so globals.css can point --x-font-sans at it.
const satoshi = localFont({
  src: [
    { path: './fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Satoshi-Italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Satoshi-BoldItalic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
})

// JetBrains Mono is the twin's data face (code blocks in the docs) — same
// loader the landing uses. Until 2026-08-30 the docs named the face in CSS
// but never loaded it, so code fell back to the system mono.
const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

// Only keys that exist in nextra-theme-docs@4.6.1 `LayoutPropsSchema`
// (a z.strictObject — unknown keys are rejected). The brief's `logo`, `project`
// and `footer: { text }` are NOT in the 4.6.1 schema — `footer` is a
// `reactNode` slot, and `logo`/`project` don't exist. The wordmark + project
// link are rendered inside <DocsNavbar> via the `navbar` slot instead.
const config = {
  sidebar: { autoCollapse: true },
  docsRepositoryBase:
    'https://github.com/durgaprasadreddyv/website/tree/main/apps/docs',
  navbar: <DocsNavbar links={crossNavLinks} />,
  // The close of the page, in the nav's grammar: brand line at muted ink and
  // the cross-site links as mono labels (.docs-footer-* in globals.css) —
  // mirrors apps/blog/app/layout.tsx's Footer.
  footer: (
    <div className="docs-footer">
      <span className="docs-footer-brand">
        © {new Date().getFullYear()} · nanisoft — digital twin of the IT estate
      </span>
      <nav aria-label="Footer" className="docs-footer-links">
        {crossNavLinks
          .filter((l) => l.href !== SELF_ORIGIN)
          .map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.external ? '_blank' : undefined}
              rel={l.external ? 'noopener noreferrer' : undefined}
            >
              {l.label}
            </a>
          ))}
      </nav>
    </div>
  ),
  nextThemes: { defaultTheme: 'system', forcedTheme: undefined },
}

export const metadata: Metadata = {
  title: { template: '%s — nanisoft docs', default: 'nanisoft docs' },
  description:
    'Documentation and white papers for the nanisoft digital twin of the IT estate.',
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Layout {...config} pageMap={await getPageMap()}>
          {children}
        </Layout>
      </body>
    </html>
  )
}