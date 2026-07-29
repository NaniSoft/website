import createWithNextra from 'nextra'

const withNextra = createWithNextra({
  defaultShowCopyCode: true,
  unstable_shouldAddLocaleToLinks: true,
})


/**
 * @type {import("next").NextConfig}
 */
export default withNextra({
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  cleanDistDir: true,
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
  // The Nextra locale proxy (src/proxy.ts) was removed: Next.js 16 runs the proxy
  // on the Node.js runtime only, which @opennextjs/cloudflare does not support.
  // In-site links already carry a locale prefix (unstable_shouldAddLocaleToLinks),
  // and the LocaleToggle widget switches locales client-side. This redirect keeps
  // the bare root URL resolving to the default locale.
  redirects: async () => [
    { source: '/', destination: '/zh', permanent: false },
  ],
})
