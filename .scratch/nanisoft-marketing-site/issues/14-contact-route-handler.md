# 14 — Contact route handler + Resend + Turnstile verify + env wiring

**What to build:** The contact form actually delivers. Submissions hit an in-app Next.js route handler (`/api/contact-us`) deployed with the existing `nanisoft` Cloudflare Worker via OpenNext — no separate service. The handler verifies the Turnstile token server-side, delivers via Resend, and speaks the unified `{ status, message }` contract that ticket 13 defined. Secrets never enter the repo.

**Blocked by:** 13 — Contact form client (defines the unified submit/response contract this handler implements).

**Status:** ready-for-agent

- [ ] `src/app/api/contact-us/route.ts`: server-side Turnstile verify (skipped when sitekey/secret unset), Resend delivery, returns unified `{ status, message }`.
- [ ] Degradation: Turnstile sitekey/secret unset → verification skipped, form still works; Resend secrets unset → returns `{ status: 'error', ... }`.
- [ ] Secrets as CF Worker secrets via `wrangler secret put` against `nanisoft`: `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`, `CONTACT_TO_ADDRESS` (defaults to `RESEND_FROM_ADDRESS`). Public `vars` in `wrangler.jsonc`: `NEXT_PUBLIC_TURNSTILE_SITEKEY` (empty until provisioned) + `NEXT_PUBLIC_CONTACT_ENDPOINT = /api/contact-us`. `.dev.vars.example` committed (test sitekey `1x00000000000000000000AA`, always passes).
- [ ] Vitest at the handler boundary with Turnstile `fetch` and the Resend client mocked (no real network/email): success on valid token + Resend send; error when Turnstile verification fails; error when Resend fails; skips verification + succeeds when sitekey/secret unset; error when Resend secrets unset.
- [ ] Verify OpenNext/Cloudflare compatibility at `pnpm build` / `pnpm preview` (route handler on Workers runtime — fog item to confirm).
- [ ] `pnpm check` green.
