# 07 — Foundation: strip template/demo content & set Nanisoft brand metadata + dark-default theme

**What to build:** A clean, branded shell with no template residue, so every later ticket builds on a neutral base. From a visitor's perspective the site loads titled "Nanisoft", dark by default, with no demo auth, no `ai-demo` page, no `introduction`, no template docs examples, and no starter banner — and the old "What's New" route is gone, replaced by a "Changelog" label that lives in the footer. From an operator's perspective the real brand metadata (title, description, repo, canonical, GitHub URL, dark-default theme) is in place. This is the prefactor; it makes the rest easy.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `layout.tsx`: title/nav logo = `Nanisoft` (drop "My Nextra Starter" + emoji); description/og:description = the locked Nanisoft positioning; `repo`/`docsRepositoryBase` = `https://github.com/nanisoft`; canonical + `metadataBase` keep `https://www.nanisoft.com`; remove the starter `CustomBanner`; switch `nextThemes.defaultTheme` from `'system'` to dark-default.
- [ ] `i18n/en.ts`: `systemTitle` = `Nanisoft`; remove/repurpose the `banner.*` copy.
- [ ] Remove demo/template content: `ai-demo.mdx` (+ `AIDemoLanding` wiring), `login.mdx` + `src/components/auth/*`, the navbar auth widgets (`auth-button`, `mobile-menu-auth`) and their inclusion in `navbar-extras.tsx`, `introduction.mdx`, and the template docs examples under `src/content/en/docs/`.
- [ ] Repurpose the `/en/upgrade` route shell: rename `upgrade.mdx` → `changelog.mdx`, `_meta.tsx` label "Changelog" (drop "What's New" + `TitleBadge`), move from main nav to footer-linked. (The actual changelog data/content lands in ticket 10.)
- [ ] `NEXT_PUBLIC_GITHUB_URL` wired to `https://github.com/nanisoft`; `next-sitemap` `SITE_URL` confirmed `https://www.nanisoft.com`.
- [ ] `pnpm check` green; `pnpm build` green (routing/metadata/_meta changed).
