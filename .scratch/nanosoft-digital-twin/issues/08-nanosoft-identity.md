# 08 — nanisoft identity system (tokens, wordmark, motion)

**What to build:** The "Living Map" identity as a shared system both apps consume — palette, typography, shape lock, motion, wordmark, favicon — so the landing and playground read as one brand grounded in the digital-twin subject matter. Brand is greenfield; this identity is the spec.

**Blocked by:** 06 (Monorepo scaffold + relocate landing).

**Status:** done
**Assignee:** agent
**Resolved:** 2026-08-22 (merged `ab9aa1a` / `6a4e61b` on main)
**Verified:** 2026-08-22 — `packages/identity` (tokens `#0C2A33` petrol / `#F4EFE6` bone / `#2A8C97` teal / `#14A77A` jade-via-`role.accent` only; `radius {card:20,inner:12,pill:9999}`; `font.voice`=Satoshi, `font.data`=JetBrains Mono; motion breathe/traverse/ripple/settle on `cubic-bezier(.32,.72,0,1)` + `withReducedMotion` static endState; wordmark W1 jade-once-on-stroke + W3 monogram). Identity suite 33/33 green. Note: `apps/landing` still uses Inter until ticket 18 re-themes it — ticket 08's bar is the *package* exporting tokens, which it does.

- [x] Token definitions: petrol/bone base, teal secondary, jade as the single locked accent (live/active only, never decorative); no purple/neon/pure-black/white; shape lock cards radius 20 / inner 12 / buttons pill
- [x] Typography: Satoshi (voice/body/headings) + JetBrains Mono (data/tables/query/logs/node labels); italic = emphasis, no serif
- [x] Motion: the four principles (breathe / traverse / ripple / settle) as reusable variants easing `cubic-bezier(.32,.72,0,1)`; `prefers-reduced-motion` honored (degrades to a static end-state, never removes content)
- [x] Wordmark W1 "node + flow" (Satoshi 700, "i" dot = ringed graph node + trailing live link, jade reserved for the active link) + W3 monogram favicon
- [x] A tokens/preview surface (or landing top-nav) renders the wordmark + palette/type in tokens; tests assert token values and that reduced-motion produces the static fallback