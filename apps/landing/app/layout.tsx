import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { APP_NAME } from '@nanisoft/architecture';
import { IDENTITY_VERSION } from '@nanisoft/identity';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  title: 'Sentinel Lake — Security Data Lake & Knowledge Graph',
  description:
    'Unify IT, HR, IAM, cloud, and security telemetry into a single temporal graph. Answer your hardest forensic questions in seconds with AI agents.',
  // The shared identity package is wired here; full token consumption (re-theme
  // to the nanisoft "Living Map" palette/type/wordmark) arrives in ticket 18.
  other: { 'nanisoft-identity': IDENTITY_VERSION },
};

const themeBootstrap = `
  (function () {
    try {
      var saved = localStorage.getItem('sentinel-theme');
      var mode = saved || 'system';
      var resolved = mode === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode;
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.style.colorScheme = resolved;
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-app={APP_NAME} className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
