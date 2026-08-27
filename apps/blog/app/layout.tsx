import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Layout } from 'nextra-theme-blog'
import 'nextra-theme-blog/style.css'
import { crossNavLinks } from '@nanisoft/identity'
import BlogNavbar from './blog-navbar'
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
    <html lang="en" className={satoshi.variable} suppressHydrationWarning>
      <body>
        <BlogNavbar links={crossNavLinks} />
        <Layout nextThemes={{ defaultTheme: 'system' }}>{children}</Layout>
      </body>
    </html>
  )
}