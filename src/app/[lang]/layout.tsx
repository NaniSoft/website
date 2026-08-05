import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import type { I18nLangKeys } from '@/i18n'

import { IBM_Plex_Sans } from 'next/font/google'
import { LastUpdated, Layout } from 'nextra-theme-docs'
import { Head, Search } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Navbar } from '@/components/Navbar'
import { SiteFooter } from '@/components/SiteFooter'
import { Toaster } from '@/components/ui/sonner'
import { getServerLocale } from '@/hooks'
import { githubUrl } from '@/lib/site-config'
import { getDirection } from '../_dictionaries/get-dictionary'

import './styles/index.css'

// IBM Plex Sans via next/font — the variable lands on <html> and is paired to
// --font-sans in the @theme inline block of index.css, so `font-sans`
// utilities (and the body) resolve to Plex. The Next 16.2 next/font/google
// regression is fixed in next@16.2.12 (which we run).
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const siteUrl = 'https://www.nanisoft.com'
const description
  = 'Nanisoft builds the cybersecurity tools that large organizations otherwise build in-house — filling the gaps left by enterprise security suites.'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Nanisoft',
  description,
  icons: '/img/favicon.svg',
} satisfies Metadata

// Explicit props type instead of the `LayoutProps<'/[lang]'>` global that
// Next.js generates into `.next/types`. That generated type only exists after
// `next build`/`next dev` has run, but CI runs `pnpm typecheck` *before* the
// build — so relying on it fails the verify gate on a fresh checkout.
interface RootLayoutParams {
  children: ReactNode
  params: Promise<{ lang: string }>
}

export default async function RootLayout({ children, params }: RootLayoutParams) {
  const getterParams = await params

  const { lang } = getterParams as { lang: I18nLangKeys }

  const pageMap = await getPageMap(lang)

  const { t } = await getServerLocale(lang)

  return (
    <html
      lang={lang}
      dir={getDirection(lang)}
      className={ibmPlexSans.variable}
      suppressHydrationWarning
    >
      <Head
        color={{ hue: 67, saturation: 100, lightness: { dark: 55, light: 22 } }}
        backgroundColor={{ dark: '#111', light: '#fff' }}
      >
        <meta property="og:title" content="Nanisoft" />
        <meta name="description" content={description} />
        <meta property="og:description" content={description} />
        <link rel="canonical" href={siteUrl} />
      </Head>
      <body>
        <Layout
          copyPageButton={false}
          navbar={
            <Navbar githubUrl={githubUrl} />
          }
          lastUpdated={(
            <LastUpdated>
              { t('lastUpdated') }
            </LastUpdated>
          )}
          editLink={null}
          docsRepositoryBase={githubUrl}
          footer={(
            <SiteFooter />
          )}
          search={(
            <Search
              placeholder={t('search.placeholder')}
              emptyResult={t('search.noResults')}
              errorText={t('search.errorText')}
              loading={t('search.loading')}
            />
          )}
          i18n={[
            { locale: 'en', name: 'English' },
          ]}
          toc={{
            backToTop: t('backToTop'),
            title: t('pageTitle'),
          }}
          pageMap={pageMap}
          feedback={{ content: '' }}
          nextThemes={{
            attribute: 'class',
            defaultTheme: 'dark',
            storageKey: 'nanisoft-theme',
            disableTransitionOnChange: true,
          }}
        >
          {children}
        </Layout>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
