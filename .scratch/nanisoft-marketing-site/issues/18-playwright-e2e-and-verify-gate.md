# 18 — Playwright e2e + full verify gate

**What to build:** Confidence that the whole marketing site behaves end to end. External-behavior Playwright e2e against `pnpm start` (port 7000) covers the new pages, nav/footer resolution, the contact form's success/error/degradation states, and the `/`→`/en` redirect. The full `pnpm check` + `pnpm build` gate is green with routing/metadata/static-params exercised.

**Blocked by:** 14 — Contact route handler, 15 — Navbar, 16 — Footer, 17 — Homepage composition (everything integrated before the gate runs).

**Status:** ready-for-agent

- [ ] Playwright e2e (extending the existing suite): homepage renders hero + all six sections; primary CTA links to `/en/products`.
- [ ] `/en/products`, `/en/blog`, `/en/about`, `/en/changelog` return 200 and render expected top-level content; `/en/changelog` shows the inaugural entry.
- [ ] Navbar Products mega-menu groups + anchors resolve; Blog/About/Contact links resolve; GitHub icon links to the configured org and is omitted when unset.
- [ ] Footer flagship product links, Resources, Company, and social links resolve; unset social links are absent.
- [ ] Contact form: with the test Turnstile sitekey, a valid submission → success toast + inline "thank you"; an error response → error toast + inline `mailto:` fallback. With sitekey unset, the Turnstile widget is absent and the form still posts to the in-app route.
- [ ] The `/`→`/en` redirect holds.
- [ ] `pnpm check` (typecheck + lint + format:check + test:run) green; `pnpm build` green (routing/metadata/static-params changed across the effort).
