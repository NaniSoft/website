import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${satoshi.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}