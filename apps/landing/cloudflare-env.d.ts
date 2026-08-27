// Augments the global `CloudflareEnv` interface declared by
// `@opennextjs/cloudflare` with the contact-form bindings from `wrangler.jsonc`.
// OpenNext's typegen (`wrangler types --env-interface CloudflareEnv`) would
// emit an equivalent file; this is the minimal hand-written form so the build
// type-checks without running wrangler. Keep in sync with wrangler.jsonc.
declare global {
  interface CloudflareEnv {
    CONTACT_DB: D1Database;
    RESEND_API_KEY: string;
    CONTACT_NOTIFY_FROM: string;
    CONTACT_NOTIFY_TO: string;
  }
}

export {};