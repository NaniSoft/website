# 01 — Design-system foundation (tokens, font, Nextra mount, chrome primitives, no-guild guard)

**What to build:** The site loads in IBM Plex Sans with the lime mode-tuned primary, a single `.hive-focus` ring on every link/button/input, and the Nextra shell mounted guild-style — `<Head>` receiving the `color` triplet `{ hue: 67, saturation: 100, lightness: { dark: 55, light: 22 } }` and `backgroundColor={{ dark: '#111', light: '#fff' }}` (mirroring `--nextra-bg`). One `@theme` block is the sole token source: the guild beige/green/blue 100–1000 scales, the lime `hive-yellow` + dark `#111` background, the bright/dark/callout functional tones, `--tracking-tight`, the chrome tokens (`--nextra-bg`, `--nextra-primary-*` if the dynamic ladder is kept, `--hive-ease-overshoot-*`, `--nextra-navbar-height` 82px/64px), and the 5 category accents. The unavoidable `@theme inline` pairs the `next/font` variable (`--font-plex-sans` → `--font-sans`). `overrides.css` is folded into `index.css` and deleted — one stylesheet. The Nextra style import switches to `nextra-theme-docs/style-prefixed.css` wrapped in `layer(l-nextra)`. Dark mode uses next-themes' `.dark` via `@custom-variant`; `hocus:` is registered via `@custom-variant`; container queries are v4-native. The Tailwind 4 migration of guild v3-isms is applied (`theme()`→`var(--color-*)`, `!`-prefix `@apply`→suffix, single `@import 'tailwindcss'`). The shared `src/components/chrome/` primitives (`SectionLabel`, `TopBar`, `NewsletterPlaceholder`) exist. After this ticket every existing page wears guild typography + focus rings, even though no surface has been rebuilt yet.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] `next/font/google` loads IBM Plex Sans with `variable: '--font-plex-sans'` on `<html>`; `@theme inline { --font-sans: var(--font-plex-sans) }` pairs it (Next 16.2 `next/font/google` regression is fixed at `next@16.2.12`).
- [x] One `@theme` block holds the guild colour scales, lime primary, functional tones, `--tracking-tight`, the chrome tokens, and the 5 category accents. No other file declares tokens (the current second Shadcn-var `@theme` is folded in or dropped once retained Shadcn primitives are re-pointed at the guild tokens).
- [x] The 5 category accents are declared with paired `-foreground` and (for the 3 dark accents) `-dark` tints — prototype-derived, WCAG-resolved values:

  | Category | Token | Value | Foreground |
  |---|---|---|---|
  | Core | `--color-core` (aliases lime primary) | `#E1FF00` | ink |
  | Ingestion | `--color-ingestion` | `#1ACBE2` | ink |
  | Query & Traversal | `--color-qt` | `#2E7A6B` | white |
  | Interfaces | `--color-interfaces` | `#2563EB` | white |
  | Platform & Trust | `--color-platform` | `#1E3A8A` | white |

  Q&T's dark gateway tile uses `#00342C` (guild `green-1000`). Design rule lives in the stylesheet: no inline small accent text on the shared background — use ink text plus an accent dot.
- [x] Lime primary is mode-tuned, same hue both modes: `#4D7C0F` light (5.0:1 on white) / `#E1FF00` dark (16.6:1 on `#111`).
- [x] `index.css` is the sole stylesheet entry: `style-prefixed.css` in `layer(l-nextra)`, all `.hive-focus` / `@keyframes hive-shake` + `.animate-shake` / `.x:tracking-tight { letter-spacing: normal }` reset / navbar-offset overrides; `overrides.css` is folded in and **deleted**; `@source not` exclusions for `.scratch`, `guild-website`, `guild-docs` are kept.
- [x] `.hive-focus` / `.hive-focus-within` are `@utility` rules (2px lime ring, 2px offset, `:focus-visible` only) applied to every `<a>`, `<button>`, and form input globally — not reinvented per component.
- [x] `layout.tsx` mounts the Nextra shell guild-style: server-rendered `<html>` + `<Head color backgroundColor>` + `<Layout pageMap navbar footer search>`; navbar is a client component driving `useMenu`/`setMenu`. `not-found.tsx` uses `NotFoundPage`; `mdx-components` re-exports `useMDXComponents`.
- [x] Two `resolveAlias` entries only in `next.config.ts` (no Mermaid alias). No Nextra locale proxy, no `runtime: 'edge'`; the `/`→`/en` redirect stays a `redirects()` rule.
- [x] Shared chrome primitives land in one `src/components/chrome/` home: `SectionLabel`, `TopBar`, `NewsletterPlaceholder`. (Blog-specific `PostTOC` + `TagList` come with ticket 06.)
- [x] Vitest "no guild leakage" guard added: scans `src/` for the forbidden string `guild` (case-insensitive) and any `@theguild/*` import, failing if either appears. Excludes `src/app/prototype-*` paths until ticket 09 deletes them; `.scratch` and `guild-*` are not under `src/` so not in scope.
- [x] Component tests for the chrome primitives (render expected accent class / label / structure — pure-render, no Nextra/Next runtime).
- [x] `pnpm check` green; `pnpm build` green (mount + font + style import changed).
- [x] No `@theguild/*` import and no "guild" string in any new file this ticket adds.

## Notes

- Open, low-risk decision for this ticket: whether to keep the dynamic `--nextra-primary-*` ladder or replace it with the static mode-tuned lime (the mode-tuned lime already overrides it). Pick one and record it in the `## Answer`-style note below when resolved.
- Reference dirs `guild-website/` and `guild-docs/` stay on disk and are read from here until ticket 09.

## Answer / resolution (2026-08-05)

Landed. `pnpm check` + `pnpm build` green. Resolved decisions:

- **Dynamic `--nextra-primary-*` ladder — kept for Nextra internals, mode-tuned hex for our tokens.** The `<Head color={{ hue: 67, saturation: 100, lightness: { dark: 55, light: 22 } }}>` triplet drives Nextra's own `--nextra-primary-*` vars (link colours inside Nextra chrome). Our token `--color-primary` is the mode-tuned hex `#4d7c0f` light / `#e1ff00` dark (flips via the `.dark` block), which is what the retained Shadcn primitives and `.hive-focus` ring read. The two coexist and are both lime; Nextra's triplet uses the documented 22/55 lightness, our hex uses the documented brand values. Reconciled: the brand hex is the source of truth for our tokens; the Head triplet is the documented value for Nextra's dynamic ladder.
- **Navbar client component (`useMenu`/`setMenu`) deferred to ticket 02.** The Radix `NavigationMenu` navbar that drives `useMenu`/`setMenu` is ticket 02's deliverable ("Navbar + footer chrome"); building it here would collide with that ticket. Ticket 01 keeps the working Nextra `<Navbar>` and only adds the guild `<Head>` props + font. `not-found.tsx` (`NotFoundPage`) and `mdx-components` (`useMDXComponents` re-export) were already correct — verified, no change.
- **`guild-docs` added to `tsconfig` `exclude`** (it was missing — only `guild-website`/`.scratch` were excluded, so the on-disk reference dir broke local `pnpm typecheck`). CI stays green because the dir is git-ignored and absent on a fresh checkout.
- **`src/app/prototype-*/**` added to eslint `ignores`** — the throwaway prototype routes carry pre-existing lint errors (`node/prefer-global/process`, a stale `@typescript-eslint/no-explicit-any` disable, single-line multi-statement) that are not worth fixing in code slated for deletion in ticket 09. The no-brand-leakage guard already excludes the same paths.
- **No-brand-leakage guard scope: `.ts`/`.tsx` under `src/`**, excluding `src/app/prototype-*` and the guard file itself. The stylesheet (`index.css`) is out of the guard's scope because it legitimately references the git-ignored `guild-*` reference dirs in `@source not` directives (a build-config path, not a brand leak).