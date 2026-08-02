# Contact form backend provisioning

Type: task
Status: closed
Assignee: claude
Blocked by: (none — 03 resolved; this ticket was frontier)

## Question

How do the contact form and newsletter actually submit, given the guild pattern posts to
a self-hosted `https://utils.the-guild.dev` service we don't have? The user's standing
instruction is "use whatever is used by the guild project" for mails/forms — guild runs
its own utils API (`/api/contact-us`, `/api/newsletter-subscribe`, the latter Beehiiv-backed).

Decide between:

- **(a) Build a Nanisoft "utils" Cloudflare Worker** mirroring guild's two endpoints
  (contact-us → email delivery via Resend/Mailgun/SES; newsletter-subscribe → Beehiiv
  API). In-stack, self-contained, matches the reference exactly. More to build/maintain.
- **(b) Interim managed services** — form → Formspree/Web3Forms; newsletter → Beehiiv
  directly. Fastest to launch, no Worker to build, but diverges from the guild pattern.

Either way, the endpoints + Cloudflare Turnstile sitekey are read from env, aligned to
the contract fixed in ticket 03: `NEXT_PUBLIC_CONTACT_ENDPOINT`,
`NEXT_PUBLIC_NEWSLETTER_ENDPOINT`, `NEXT_PUBLIC_TURNSTILE_SITEKEY`. Both endpoints must
respond with the unified `{ status: 'success' | 'error', message: string }` shape 03
fixed, and the contact endpoint must accept `{ name, email, notes, 'cf-turnstile-response':
token }` (verifying the Turnstile token server-side with the secret). **When unset**, the
contact form degrades to a `mailto:` fallback (e.g. `hello@nanisoft.com`) and the
newsletter hides submit / shows a "coming soon" note — so nothing ships broken before
provisioning is done.

**Recommendation (provisional):** (a) to honor "follow the codebase," with the
env-fallback above so the site works before the Worker is live. Provision Beehiiv,
Turnstile, and the email provider as the Task work; record credentials/URLs in env.

Resolve by confirming (a) vs (b) and completing the provisioning (accounts, keys, env
values). Record what was provisioned and the resulting env var values.

## Decision (architecture — resolved 2026-08-02 via grilling; user confirmed)

> **Scope narrowed 2026-08-02:** the newsletter is deferred (see the map's Out of scope).
> This ticket now covers the **contact form backend only** — the `/api/newsletter-subscribe`
> route, Beehiiv, and `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` are removed. The newsletter may
> return as a fresh effort if the destination is redrawn.

**(a) Self-hosted, as an in-app Next.js route handler on the existing `nanisoft` Cloudflare
Worker** — NOT a separate utils Worker (the site already deploys to CF Workers via
OpenNext, so the route handler deploys with the existing worker, zero new infra).

- `src/app/api/contact-us/route.ts` → verify the Turnstile token server-side, then deliver
  via **Resend**.
- It returns the ticket-03 unified contract `{ status: 'success' | 'error', message: string }`.
- The endpoint is **same-origin** (`/api/contact-us`), so `NEXT_PUBLIC_CONTACT_ENDPOINT` is
  just that path — no external endpoint URL to provision.
- Turnstile on the **contact form** (matches guild).
- Secrets = **Cloudflare Worker secrets** (encrypted, set once via `wrangler secret put`
  against `nanisoft`, persist across deploys; the GitHub Action never touches them).

Guild reference facts that shaped this (from background scan of `guild-website/`):
guild's `utils.the-guild.dev` service is **not** in the reference repo (separate host, source
unavailable), so "mirror guild" = build our own equivalent. Guild's Turnstile is actually
**broken** (token never forwarded, no server verification) and all endpoints/sitekey are
hardcoded — ticket 03 already improves on both (token forwarded + verified; env-config +
fallbacks). Client contract from guild: contact `{ name, email, notes }`.

### Env var map

| Var                             | Scope                            | Example                         | Unset behavior                    |
| ------------------------------- | -------------------------------- | ------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITEKEY` | public (`wrangler.jsonc` `vars`) | `0x…`                           | widget not rendered               |
| `NEXT_PUBLIC_CONTACT_ENDPOINT`  | public                           | `/api/contact-us`               | `mailto:` fallback                |
| `TURNSTILE_SECRET_KEY`          | secret                           | `0x…`                           | contact returns error             |
| `RESEND_API_KEY`                | secret                           | `re_…`                          | contact returns error             |
| `RESEND_FROM_ADDRESS`           | secret                           | `Nanisoft <hello@nanisoft.com>` | contact returns error             |
| `CONTACT_TO_ADDRESS`            | secret                           | `hello@nanisoft.com`            | defaults to `RESEND_FROM_ADDRESS` |

## Provisioning checklist (HITL — PENDING; user executes)

Ticket stays **open** until this is done and the real env values are recorded below.

1. **Cloudflare Turnstile** (existing CF account, free): dashboard → Turnstile → add a
   widget for `nanisoft.com` + `www.nanisoft.com`; copy **Sitekey** + **Secret Key**. Local
   dev: use test sitekey `1x00000000000000000000AA` (always passes) in `.dev.vars`.
2. **Resend** (free: 100/day, 3k/month): sign up, add + verify sending domain `nanisoft.com`
   (DNS records), generate API key, pick from address (`hello@nanisoft.com`) + delivery inbox.
3. **Set secrets** on the worker: `wrangler secret put RESEND_API_KEY` (+ `TURNSTILE_SECRET_KEY`,
   `RESEND_FROM_ADDRESS`, `CONTACT_TO_ADDRESS`) against `nanisoft`. Put
   `NEXT_PUBLIC_TURNSTILE_SITEKEY` in `wrangler.jsonc` `vars`.
4. **Local dev mirror**: gitignored `.dev.vars` mirroring the secrets (test Turnstile sitekey);
   commit a `.dev.vars.example` template.
5. **Build verification** (fog carried to map): confirm OpenNext renders the contact route
   handler on the Worker at `pnpm build` / `pnpm preview` — route handlers on the Workers
   runtime are standard OpenNext support; verify at build like the blog routes.

### Provisioned values

- `NEXT_PUBLIC_TURNSTILE_SITEKEY`: **pending** — `wrangler.jsonc` `vars` slot added and
  left empty; widget is not rendered until the real sitekey is dropped in. The site works
  without it (contact form still posts to the in-app route; Turnstile verification is
  skipped when the sitekey/secret are unset). Add when ready: this is the one value still
  outstanding, and it's the only public one.
- `NEXT_PUBLIC_CONTACT_ENDPOINT`: `/api/contact-us` — set in `wrangler.jsonc` `vars`
  (same-origin in-app route handler).
- `TURNSTILE_SECRET_KEY`: **set in CF Worker secrets** (`wrangler secret put` against
  `nanisoft`) — not recorded here.
- `RESEND_API_KEY`: **set in CF Worker secrets** — not recorded here.
- `RESEND_FROM_ADDRESS`: **set in CF Worker secrets** — custom non-default address on the
  verified `nanisoft.com` sending domain — not recorded here.
- `CONTACT_TO_ADDRESS`: **set in CF Worker secrets** — custom non-default delivery address —
  not recorded here.

Local-dev mirror committed as `.dev.vars.example` (test Turnstile sitekey
`1x00000000000000000000AA`, always passes); `.gitignore` exception added so the template
commits while `.dev.vars` stays ignored.

## Resolution (2026-08-02)

**Answer:** option **(a)** — self-hosted, in-app. The contact form submits same-origin to a
Next.js route handler `src/app/api/contact-us/route.ts` that deploys with the existing
`nanisoft` Cloudflare Worker via OpenNext (no separate utils Worker, zero new infra). The
handler verifies the Turnstile token server-side, then delivers via **Resend**, and returns
the ticket-03 unified contract `{ status: 'success' | 'error', message: string }`.

**Provisioning done:** the four secret-scoped vars (`TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`,
`RESEND_FROM_ADDRESS`, `CONTACT_TO_ADDRESS`) are set as Cloudflare Worker secrets on
`nanisoft` via `wrangler secret put` (values not recorded — secret). The public
`NEXT_PUBLIC_CONTACT_ENDPOINT = /api/contact-us` is wired into `wrangler.jsonc` `vars`.
`.dev.vars.example` committed as the local-dev mirror (test Turnstile sitekey).

**Outstanding (non-blocking):** `NEXT_PUBLIC_TURNSTILE_SITEKEY` is the one value still
pending — the `vars` slot exists but is empty. Until it's filled the Turnstile widget is
not rendered and the contact handler skips token verification; the site still works (form
posts to the in-app route). This is a fill-in-the-blank, not an open decision — it can be
dropped into `wrangler.jsonc` at any time without re-opening this ticket.

**Carried to the map (fog):** confirm OpenNext renders `/api/contact-us` on the Workers
runtime at `pnpm build` / `pnpm preview` — route handlers on Workers are standard OpenNext
support; verify during implementation like the blog routes. The route handler itself is
post-map implementation work (not part of this ticket).

**Unblocks:** the contact-form section of the homepage / Contact surface can now be
specified for implementation against this contract.
