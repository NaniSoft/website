import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { APP_NAME } from '@nanisoft/architecture';
import { IDENTITY_VERSION, themeBootstrapScript } from '@nanisoft/identity';
import './globals.css';

// Satoshi (the voice) is a Fontshare typeface (ITF Free Font License,
// commercial use permitted) — not on Google Fonts, so it ships as local
// woff2 files downloaded from api.fontshare.com. JetBrains Mono (the twin's
// data face) self-hosts via next/font/google.
const satoshi = localFont({
  src: [
    { path: './fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Satoshi-Italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Satoshi-BoldItalic.woff2', weight: '700', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-satoshi',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  title: 'nanisoft — digital twin of the IT estate',
  description:
    'nanisoft builds a living digital twin of your organization’s IT estate: a queryable graph of how its systems connect and actually work.',
  other: { 'nanisoft-identity': IDENTITY_VERSION },
};

// No-FOUC theme bootstrap — the shared contract from @nanisoft/identity (same
// string the playground's app/layout.tsx renders; one constant, so the two
// apps cannot drift). Runs synchronously during HTML parsing; ThemeProvider
// keeps it reconciled after hydration.
const themeBootstrap = themeBootstrapScript;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-app={APP_NAME} className={`${satoshi.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
