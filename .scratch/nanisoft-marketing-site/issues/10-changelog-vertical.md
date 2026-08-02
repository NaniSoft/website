# 10 — Changelog vertical: data module + component + `/en/changelog` page + tests

**What to build:** A real changelog at `/en/changelog` showing one inaugural "Introducing Nanisoft" entry, so a visitor can see what has shipped and the format future entries will follow. A typed data module + a `Changelog` component (mirroring the blog data-module pattern) render the entry, so the list stays sortable and the route isn't per-entry MDX sprawl.

**Blocked by:** 07 — Foundation (which renames the route shell `upgrade`→`changelog`).

**Status:** ready-for-agent

- [ ] `src/lib/changelog.ts`: typed reverse-chronological array of `{ date, title, summary, body }`.
- [ ] `Changelog` component renders entries from the module.
- [ ] Inaugural entry present: author "Nanisoft Team", title "Introducing Nanisoft", date 2026-08-03, framing = problem (custom in-house gap-fillers) → approach (one cohesive suite) → first chapter (Core trio + 4 categories, 21 products) → "more coming" (no fabricated metrics/dates/customers).
- [ ] `/en/changelog` renders the component; footer-linked, not main-nav.
- [ ] Vitest at the `src/lib` seam: entries reverse-chronological; inaugural entry present with the agreed title/date/author and the four framing sections.
- [ ] `pnpm check` + `pnpm build` green.
