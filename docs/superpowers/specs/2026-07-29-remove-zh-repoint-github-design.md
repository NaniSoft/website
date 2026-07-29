# Remove the `zh` locale & repoint GitHub references to NaniSoft

**Date:** 2026-07-29
**Status:** Approved-in-principle (awaiting user review)

## Goal

1. Remove the Chinese (`zh`) locale entirely — delete its dictionary, content tree,
   registrations, and all `zh`-specific code branches — while **keeping the i18n
   infrastructure intact** so a new language can be added later by following the
   existing documented workflow.
2. Make `en` the default and only locale. English is served at `/en/...`; the bare
   root `/` redirects to `/en`.
3. Translate Chinese-language **code comments** to English (the `zh` *content* is
   deleted; the *comments* are rewritten for future reference).
4. Repoint every `https://github.com/pdsuwwz/nextjs-nextra-starter` reference (and the
   `pdsuwwz` / Wisdom / personal-email attribution) to the NaniSoft organization /
   `https://github.com/NaniSoft/website` (the actual git remote).
5. Update `CLAUDE.md` to reflect the single-locale, NaniSoft-pointed reality.

## Decisions (locked with user)

- **Routing:** Keep the `src/app/[lang]` segment. `locales: ['en']`,
  `defaultLocale: 'en'`, redirect `/` → `/en`. English keeps the `/en` prefix. The
  root-serving alternative was rejected: it is a bigger refactor and makes the
  future language *harder* (requires middleware, which OpenNext/Cloudflare cannot
  run — see CLAUDE.md "Next.js 16 + middleware caveat").
- **Attribution:** Repoint to NaniSoft. `package.json` author, the footer author
  link, the README copyright line, and the LICENSE copyright holder move from
  `Wisdom <pdsu.wwz@foxmail.com>` to `NaniSoft`. Personal handle/email removed.
- **Starter-internal docs:** Delete `src/content/en/upgrade.mdx` and
  `src/content/en/docs/i18n.mdx` and clean their navigation entries. Keep the
  remaining product/demo English docs (`index`, `introduction`, `login`, `ai-demo`,
  `docs/index`, `docs/examples/*`).

## Out of scope (explicitly)

- Rebranding product copy / dictionary values beyond the `@pdsuwwz` FAQ reference
  (e.g. `systemTitle: 'Nextra Starter Template'` stays — not a URL or locale issue).
- Starter-prefixed localStorage keys (`starter-banner`, `starter-theme-provider`).
- Starter analytics IDs in `ThirdPartyScripts.tsx` (already flagged in CLAUDE.md).
- Build artifacts (`public/_pagefind/*`, `public/sitemap-0.xml`, `.open-next/**`) —
  gitignored; regenerate on `pnpm build`. No manual deletion required.

## Implementation plan

### A. Locale config & i18n core

1. **`next.config.ts`**
   - `locales: ['zh', 'en']` → `locales: ['en']`; `defaultLocale: 'zh'` → `'en'`.
   - Redirect `{ source: '/', destination: '/zh', ... }` → `destination: '/en'`.
     Update the comment block to say default locale is `en`.
   - Keep `unstable_shouldAddLocaleToLinks: true` (keeps `/en` prefix on links).

2. **`src/i18n/index.ts`**
   - Remove `import zh from './zh'` and the `zh,` entry in `i18nConfig`.
   - Translate the 5 Chinese comments (L14, L31, L37, L47, L53) to English.
   - `I18nLangKeys` narrows to `'en'` automatically — no caller changes needed.

3. **`src/i18n/zh.ts`** — **delete the file.**

4. **`src/app/_dictionaries/get-dictionary.ts`**
   - Rebase the dictionary type off `en`: `import type En from '@/i18n/en'`; the
     `dictionaries` map and `satisfies Record<…, { default: typeof En }>`; return
     type `Promise<typeof En>`.
   - Remove the `zh: () => import('@/i18n/zh')` entry and the `case 'zh':` in
     `getDirection`.

5. **`src/i18n/ai-demo.ts`**
   - Simplify the two-locale fallback `lang === 'zh' ? 'zh' : 'en'` (L98) to a
     single-locale resolution (default to `'en'`).

### B. Nextra shell

6. **`src/app/[lang]/layout.tsx`**
   - `const repo = 'https://github.com/pdsuwwz/nextjs-nextra-starter'` →
     `'https://github.com/NaniSoft/website'` (used by banner link, navbar
     `projectLink`).
   - `docsRepositoryBase` (L119) → `'https://github.com/NaniSoft/website'`.
   - **SEO fix (flagged):** the `<link rel="canonical" href={repo} />` (L102)
     currently points to the GitHub repo. Change it to the site domain
     (`https://www.nanisoft.com`) so canonical URLs are not GitHub URLs.
   - Remove the `{ locale: 'zh', name: '简体中文' }` entry from the Nextra `i18n`
     prop (L135), leaving only `{ locale: 'en', name: 'English' }`.
   - `title`/`description` literals (`'My Nextra Starter'`, `'A Starter template…'`)
     are product copy — left untouched (out of scope).

### C. LocaleToggle widget

7. **`src/widgets/locale-toggle.tsx`**
   - Replace the hard-coded `zh` ↔ `en` toggle (L60–65) and the two-locale icon swap
     (L93–96) with locale-list-driven logic so it works with the current single
     locale and any future locales added to config. With one locale, it renders the
     `en` icon and does not navigate (graceful no-op) — keeping the widget slot
     intact for when a second language is added.
   - Translate the 4 Chinese comments (L13, L52, L54, L72) to English.

### D. AIDemoLanding components (remove `zh` branches)

8. **`src/components/AIDemoLanding/interactions.tsx`**
   - Remove the `if (lang === 'zh') { …Chinese block… }` branch (L27–60), keep the
     English `return`.
   - Drop the `price === '定制'` half of the custom-price check (L105) — keep
     `'Custom'`.
   - Collapse every `lang === 'zh' ? '<Chinese>' : '<English>'` ternary (L119, L123,
     L138, L184, L194, L205, L220) to the English value only.

9. **`src/components/AIDemoLanding/EntryCard.tsx`**
   - Remove `const isZh = currentLocale === 'zh'` and collapse the `isZh ? … : …`
     branches (L22, L26, L30, L38) to the English strings.

### E. Content

10. **Delete the entire `src/content/zh/` directory** (11 files).
11. **Delete `src/content/en/upgrade.mdx`** and remove its `upgrade` entry from
    `src/content/en/_meta.tsx` (L50–58).
12. **Delete `src/content/en/docs/i18n.mdx`** (starter-internal). `en/docs/_meta.tsx`
    is empty, so no entry cleanup is needed.
13. **`src/content/en/docs/i18n.mdx`** is deleted, so its `zh`/`zh.ts` prose and the
    `pdsuwwz` link inside it go away with it. (No surviving en doc references `zh`
    after this; verify with a final grep.)

### F. Chinese → English code comments

14. Translate Chinese comments to English in:
    - `src/i18n/index.ts` (covered in A2)
    - `src/widgets/locale-toggle.tsx` (covered in C7)
    - `src/hooks/useLocale.ts` (L4, L8, L16)
    - `src/hooks/useServerLocale.ts` (L4, L16)
    - `src/widgets/theme-toggle.tsx` (L9)
    - `src/components/ScrollProgressBar/index.tsx` (L7–10, L30, L37, L58, L63, L66,
      L74, L78, L82, L90, L98, L102, L111, L113, L120, L139, L148, L158, L176–177)

### G. GitHub URL & attribution repoint

15. **`package.json`**
    - `name`: `nextjs-nextra-starter` → `nanisoft-website`.
    - `author`: `Wisdom <pdsu.wwz@foxmail.com>` → `NaniSoft`.
    - `homepage`, `repository.url`, `bugs.url` →
      `https://github.com/NaniSoft/website` (and `git+https://github.com/NaniSoft/website.git`).
    - `description`: update to a NaniSoft-flavored line (optional, low-risk).

16. **`src/components/CustomFooter/index.tsx`** (L60)
    - Footer author link `https://github.com/pdsuwwz` → `https://github.com/NaniSoft`,
      and change the visible label from `Wisdom` to `NaniSoft`.

17. **`src/i18n/en.ts`** (L160 FAQ answer)
    - `…contact us via GitHub @pdsuwwz.` → `…contact us via GitHub @NaniSoft.`

18. **`src/components/HomepageHero/Setup.tsx`** (L25, L137)
    - Both `href="https://github.com/pdsuwwz/nextjs-nextra-starter"` →
      `https://github.com/NaniSoft/website`.

19. **`README.md`**
    - L7 `English | 中文` language line → `English` (remove the 中文 link/anchor).
    - L9 shields.io license badge `pdsuwwz/nextjs-nextra-starter` →
      `NaniSoft/website`.
    - L149 copyright `Copyright © 2020-PRESENT [Wisdom](https://github.com/pdsuwwz)`
      → `Copyright © 2020-PRESENT [NaniSoft](https://github.com/NaniSoft)`.

20. **`LICENSE`** — change the MIT copyright holder line from `Wisdom` to `NaniSoft`
    (year range preserved).

### H. CLAUDE.md update

21. Update `CLAUDE.md` to reflect reality:
    - Project structure lines: `src/content/{zh,en}/` → `src/content/en/`; remove
      `zh.ts` from the `src/i18n/` listing.
    - Routing section: `locales: ['zh', 'en']`, `defaultLocale: 'zh'` →
      `locales: ['en']`, `defaultLocale: 'en'`; redirect `/` → `/en`.
    - "MDX content is mirrored under `src/content/zh` and `src/content/en`" →
      English-only (mirroring pattern retained for future languages).
    - `i18nConfig` from `zh + en` → from `en`.
    - Add-a-language workflow: keep, update to reflect starting from a single `en`
      locale.
    - LocaleToggle gotcha: update the "hard-coded to two locales" note (it is now
      locale-list-driven).
    - Add a short note that GitHub repo references point to
      `https://github.com/NaniSoft/website` and attribution is NaniSoft.
    - Remove the `src/content/zh` reference in the Gotchas proxy caveat if any.

### I. Verification

22. `pnpm lint` (known pre-existing-broken / non-blocking — record result).
23. `pnpm build` — must pass; regenerates sitemap + pagefind without `/zh` entries.
    Confirm `public/sitemap-0.xml` no longer contains `/zh` URLs.
24. Final grep sweep: `grep -rn "pdsuwwz\|nextjs-nextra-starter\|'/zh'\|\"zh\"\|简体\|pdsu.wwz"` over
    `src/`, `public/` (non-generated), `*.md`, `*.json`, configs — expect zero
    source matches (only regenerated build artifacts, which are gitignored).

## Notes / flagged for user

- **Canonical link SEO fix** (B6): currently `<link rel="canonical" href={repo} />`
  points at the GitHub repo. Repointed to the site domain. A per-page canonical via
  Next metadata `alternates.canonical` would be better long-term, but is out of scope
  for this task.
- **`docs/examples/*` and `docs/index.mdx`** are starter-demo content kept intact.
  If you want them removed too, say so and I'll delete them + clean `_meta.tsx`.
- **`next-sitemap.config.mjs`** fallback `https://example.com` is a starter
  placeholder; CI sets `SITE_URL`. Repointing the fallback to `https://www.nanisoft.com`
  is a trivial nicety — included only if you want it.