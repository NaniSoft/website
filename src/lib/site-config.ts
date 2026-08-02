import process from 'node:process'

// Server-side site configuration sourced from environment. The social /
// contact values are env-configured with graceful omission when unset —
// the GitHub URL defaults to the real Nanisoft org (it is always present);
// the other social links are omitted when their env var is empty.
//
// These are read at runtime from the Cloudflare Worker env (`wrangler.jsonc`
// `vars` + Worker secrets). Use this module from server components only —
// client components that need a value must receive it as a prop from a
// server component, since `process.env.NEXT_PUBLIC_*` is build-time inlined
// on the client and does not reflect runtime wrangler `vars`.

/** Nanisoft GitHub org. Defaults to the real org so the link is always present. */
export const githubUrl
  = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/nanisoft'

/** Social link URLs — `undefined`/empty when not configured (omit, don't show broken). */
export const socialLinks = {
  github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/nanisoft',
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || undefined,
  discord: process.env.NEXT_PUBLIC_DISCORD_URL || undefined,
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || undefined,
} as const

/** Canonical production origin. */
export const siteUrl
  = process.env.SITE_URL || 'https://www.nanisoft.com'
