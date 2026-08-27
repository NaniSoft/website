import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Layout } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import { crossNavLinks } from '@nanisoft/identity'
import DocsNavbar from './docs-navbar'
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
  footer: <span>{new Date().getFullYear()} · nanisoft</span>,
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
    <html lang="en" className={satoshi.variable} suppressHydrationWarning>
      <body>
        <Layout {...config} pageMap={await getPageMap()}>
          {children}
        </Layout>
      </body>
    </html>
  )
}