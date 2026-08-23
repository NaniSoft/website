# 04 — Color unification

Type: grilling
Status: resolved
Blocked by: —

## Question
Which direction unifies landing vs playground colors?

## Answer
Option A: hues don't move (identity stays single source of truth; divergence
was mode, not hue — playground was frozen light-only). Playground becomes
mode-aware via the same data-theme attribute + storage key as the landing,
system preference as fallback, plus a compact toggle in its chrome. Mode
follows you between pages. Confirmed 2026-08-23.
