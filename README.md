# Sentinel Lake — Landing Page

Marketing landing page for the Sentinel Lake cybersecurity data lake & knowledge graph.

## Stack
Next.js 14 (App Router) · TypeScript · antd v5 · @ant-design/icons · react-force-graph-2d · framer-motion

## Develop
```
npm install
npm run dev
```
Open http://localhost:3000.

## Test
```
npm test
```
Vitest + Testing Library, jsdom environment. Includes theme, graph-data, data, page render, and a11y smoke tests.

## Build
```
npm run build
npm start
```

## Theming
Theme is stored in `localStorage.nanisoft-theme` as `light` | `dark` | `system`. The initial value is set by an inline script in `app/layout.tsx` before React hydrates, so there's no theme flash on hard reload.

Toggle from the top-right of the nav, or use the OS preference to follow the system.

## Project layout
- `app/` — Next.js App Router entry, layout, page composition
- `components/` — all UI sections; `components/theme/` for theming primitives
- `lib/` — typed copy/data (data.ts), KG nodes/edges (graph-data.ts), chat transcripts (chat-transcripts.ts)
- `tests/` — Vitest suites

## Notes
- All customer/company references are placeholders.
- KG data is a hand-curated sample illustrating the concept.
- There is no sales surface or API layer: the single ask is the nav's “Open the playground” pill, which links out to the playground app.
