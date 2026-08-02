# Brand metadata + real links

Type: grilling
Status: closed
Blocked by: (none)

## Question

What are the real brand values that replace the placeholder metadata in
`src/app/[lang]/layout.tsx` and the configs? `CLAUDE.md` flags these as
replace-before-production placeholders. None can be fabricated — provide real values
(or confirm "leave env-unset/omitted").

Specifically:

- **Site title** (currently `'My Nextra Starter'`).
- **Tagline / description** (currently generic).
- **`repo` / `docsRepositoryBase` constant** (currently
  `https://github.com/pdsuwwz/nextjs-nextra-starter`).
- **Canonical** (currently hard-coded `https://www.nanisoft.com` — keep?).
- **Favicon** (`/img/favicon.svg` — keep or replace?).
- **og-image approach** — static branded SVG/PNG now, or a Cloudflare og-image worker
  like guild's `og-image.the-guild.dev`? (worker is out of scope this phase per the map).
- **GitHub URL** for the header icon — the real Nanisoft GitHub, or leave the social env
  var unset so the icon is omitted?
- **`SITE_URL`** for `next-sitemap.config.mjs` (CI sets
  `SITE_URL=https://www.nanisoft.com` — confirm).

**Recommendation:** title `Nanisoft`; description drawn from the outcome headline; repo =
the real Nanisoft GitHub URL (provide, or leave unset/omitted); canonical
`https://www.nanisoft.com` (keep); favicon keep `/img/favicon.svg`; og-image = static
branded asset this phase; `SITE_URL` keep. Provide the real values.

## Answer

Resolved 2026-08-03 via grilling. Every placeholder brand value in
`src/app/[lang]/layout.tsx` and the configs resolves to:

1. **Site title** — `Nanisoft`. Set the metadata `title` and the nav-logo
   `systemTitle` to `Nanisoft` (drop the `🚀` emoji and the "My Nextra Starter"
   string). Logo = a plain `Nanisoft` wordmark.
2. **Meta description / og:description** — `"Nanisoft builds the cybersecurity
tools that large organizations otherwise build in-house — filling the gaps
left by enterprise security suites."` Competitor names (Okta, Palo Alto) are
   **omitted** from meta and default-omitted from site copy for now; revisit
   only if hero copy explicitly wants a "vs. the suites" framing.
3. **`repo` / `docsRepositoryBase` / header GitHub icon** — all set to
   `https://github.com/nanisoft`. Concretely: the `repo` constant and
   `docsRepositoryBase` in `layout.tsx`, plus `NEXT_PUBLIC_GITHUB_URL` (the
   navbar GitHub icon / footer social link) in env config. `docsRepositoryBase`
   is dormant (`editLink={null}`, demo docs removed), so the org-vs-repo URL
   distinction doesn't matter. If the org isn't public yet the icon links to a
   404 — accepted per the user's explicit choice.
4. **Canonical + `metadataBase`** — keep `https://www.nanisoft.com`.
5. **`SITE_URL`** (next-sitemap) — keep `https://www.nanisoft.com` (CI value and
   local fallback are already correct).
6. **Favicon** — keep `/img/favicon.svg` (the starter triangle) as a temporary
   placeholder. **Branded favicon deferred** pending a real Nanisoft brand mark;
   no fabricated logo.
7. **og-image** — **leave unset** this phase (the Cloudflare og-image worker is
   out of scope per the map). A static branded og image will be generated from
   the brand mark once one exists.

**Positioning for downstream copy:** Nanisoft builds cybersecurity tools that
fill the gaps left by large enterprise security suites (authentication,
authorization, endpoint, VPN, network security) — the tools large
organizations otherwise build as custom in-house solutions.

**Deferred follow-up (not a decision ticket):** branded favicon + static
og-image, pending a Nanisoft brand mark. Mechanical wiring once a mark is
provided; tracked on the map, not ticketed (it doesn't unblock a decision).
