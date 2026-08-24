import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import { themeBootstrapScript } from '@nanisoft/identity';
import { ThemeSync } from './_theme/ThemeSync';
import './globals.css';

// Satoshi is the nanisoft voice (UI/body/headings). It is on Fontshare, not Google
// Fonts, so it is self-hosted via next/font/local (ITF Free Font License v2.0 —
// permits self-hosting + commercial use + wordmark creation; see app/fonts/
// Satoshi-LICENSE.txt). The variable font covers weights 300..900, plus italic.
const satoshi = localFont({
  src: [
    { path: './fonts/Satoshi-Variable.woff2', weight: '300 900', style: 'normal' },
    { path: './fonts/Satoshi-VariableItalic.woff2', weight: '300 900', style: 'italic' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});

// JetBrains Mono is the twin's data (tables/query/logs/node labels) — on Google
// Fonts, so it stays on next/font/google.
const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  title: 'nanisoft playground',
  description:
    'In-browser simulator of the nanisoft digital-twin architecture — mocked tool-use over a shared lakehouse state.',
};

// No-FOUC theme bootstrap — the shared contract from @nanisoft/identity (same
// string the landing's app/layout.tsx renders; one constant, so the two apps
// cannot drift). Runs synchronously during HTML parsing so the stored/OS mode
// is applied before first paint; ThemeSync then keeps it reconciled after
// hydration.
const themeBootstrap = themeBootstrapScript;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the bootstrap script mutates <html> before React hydrates.
    <html lang="en" className={`${satoshi.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}