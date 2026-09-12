import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Footer, Layout } from 'nextra-theme-blog'
import { crossNavLinks } from '@nanisoft/identity'
import { SELF_ORIGIN } from '../lib/site'
import BlogNavbar from './blog-navbar'
// The blog theme's stylesheet — WITHOUT this import the entire Nextra theme
// CSS is missing from the build and prose/scaffolding render unstyled (this
// bit us during the 2026-08-30 rebrand; the assert-themed-css.mjs build guard
// now catches it). Mirrors apps/docs/app/layout.tsx.
//
// NOTE on order: keeping this import first is still the right reading order,
// but the built export splits the two into separate CSS chunks and ships the
// theme's SECOND, so same-specificity ties resolve to the THEME, not to us.
// Brand rules that collide with a theme rule must therefore win on
// specificity (see the cascade note in globals.css §4b).
import 'nextra-theme-blog/style.css'
import './globals.css'

// Satoshi is the voice face (UI/body/headings). Mirrors apps/docs/app/layout.tsx:
// Regular, Italic, Medium, Bold, BoldItalic. `variable` exposes --font-satoshi
// on <html> so globals.css can point the theme's font token at it.
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

// JetBrains Mono is the twin's data face (code, dates, tables) — same loader
// the landing uses. Until 2026-08-30 the blog named the face in CSS but never
// loaded it, so code fell back to the system mono.
const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: { template: '%s — nanisoft blog', default: 'nanisoft blog' },
  description:
    'Engineering deep-dives and announcements from the nanisoft digital twin of the IT estate.',
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
        {/* One provider above BOTH the brand bar and the theme's <Layout>, so
            the bar's <ThemeSwitch> sees the same context the prose does. The
            class attribute is what globals.css keys the dark tokens off. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <BlogNavbar links={crossNavLinks} />
          <Layout>{children}</Layout>
          <Footer>
            {/* The close of the page, in the nav's grammar: hairline, brand
                line, cross-site links as mono labels (.site-footer-*). */}
            <div className="site-footer">
              <span className="site-footer-brand">
                © {new Date().getFullYear()} · nanisoft — digital twin of the
                IT estate
              </span>
              <nav aria-label="Footer" className="site-footer-links">
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
          </Footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
