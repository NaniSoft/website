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
    locales: ['en'],
    defaultLocale: 'en',
  },
  // The Nextra locale middleware (`nextra/locales`) runs on the Node.js runtime
  // in Next.js 16, which OpenNext for Cloudflare does not support. With a single
  // locale we don't need locale negotiation — just redirect the apex `/` to the
  // English root. `redirects()` is supported by OpenNext.
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: false,
      },
    ]
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
})
// Wire OpenNext for Cloudflare into `next dev` so Cloudflare bindings work
// locally. Dev-only so `next build` stays clean. Uses a non-blocking dynamic
// import (not top-level await) to stay compatible with Next's config loader.
if (process.env.NODE_ENV !== 'production') {
  import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev())
}
