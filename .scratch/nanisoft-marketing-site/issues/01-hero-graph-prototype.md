# Hero graph visualization prototype

Type: prototype
Status: closed
Blocked by: (none)
Assignee: claude
Resolved: 2026-08-02 — Variant A "Split" chosen by the human.

## Question

What should the homepage hero's "graph visualization with a path highlighted" look like,
and how does it sit alongside the headline **"See Every Path Into Your Systems Before
Someone Else Does,"** the small line naming the 3 flagship products (Atlas, Bedrock,
Keystone), the one-sentence subtext, and the **"Explore the Platform"** CTA?

Raise a cheap, rough, concrete prototype to react to: a React component rendering nodes

- edges as SVG, with **one path through the graph highlighted in the accent gradient**,
  subtly animated via `MotionWrapper`/framer-motion. It must blend with the existing
  dark-first theme and blue/purple/pink accent gradient, and leave room for `PanelParticles`
  (particles are not removed — their placement is settled in ticket 02).

Reference for structure/animation approach: `guild-website/ui/hero/index.tsx` — but note
guild's hero is a **tabbed product switcher** with static images; ours is a **single
headline + an animated graph**, so we diverge deliberately.

The prototype's job is to fix the visual language (node/edge style, highlighted-path
treatment, animation timing, layout vs. the headline block) before the hero is built for
real. Link the prototype artifact from this ticket on resolution.

## Artifact (prototype — throwaway)

Three structurally different hero variants on a dedicated prototype route, gated
by `?variant=`, inside the real Nextra shell (navbar/footer/theme).

**Run:** `pnpm dev` then open:

- http://localhost:8000/en/prototype-hero?variant=A — Split (text left, graph right)
- http://localhost:8000/en/prototype-hero?variant=B — Full-bleed (graph behind centered copy)
- http://localhost:8000/en/prototype-hero?variant=C — Narrative flow (horizontal graph is the story)

Flip with the floating bottom bar or the `←` / `→` arrow keys. Switcher is hidden
in production builds.

**Files:**

- `src/components/HomepageHero/HeroPrototype/` — `HeroPrototype.tsx` (host +
  `?variant=` switch), `VariantA/B/C.tsx`, `graph-primitives.tsx` (shared SVG
  atoms: node / edge / highlighted-path + blue→purple→pink accent gradient),
  `PrototypeSwitcher.tsx` (floating bar), `hero-copy.ts` (fixed placeholder copy)
- `src/content/en/prototype-hero.mdx` + `_meta.tsx` entry (display:hidden, full layout)

**Stack/decisions baked in (to react to):**

- Accent gradient = blue (`#3b82f6`) → purple (`#a855f7`) → pink (`#f472b6`);
  used on the highlighted path AND the headline text so they read as one idea.
- Highlighted path animates drawing-in (`pathLength`), nodes spring in staggered,
  hot nodes glow. `PanelParticles` is included in every variant so graph +
  particles can be judged together (informs ticket 02's particle placement).
- The graph thematically renders "every path into a system": nodes =
  ingress / identity / network / service / api / edge / data / repo / asset;
  one highlighted path = ingress → identity → service → data → asset.
- Copy is the ticket's placeholder (headline, Atlas/Bedrock/Keystone flagship
  line, subtext, "Explore the Platform" CTA). Copy polish is a later fog item.

**Awaiting reaction (HITL):** which variant wins, or which bits to combine
(e.g. "B's full-bleed graph with C's labeled spine"). The ticket resolves on
that decision; the prototype code then moves to a throwaway branch as the
primary source, and the winning visual language is recorded in the spec.

**Side config change (not part of the visual decision):** added `guild-website`
to `tsconfig.json` `exclude` — that dir is gitignored reference material that
was polluting `pnpm typecheck` locally (no CI impact; CI never has the dir).

## Resolution

**Winner: Variant A — "Split"** (text block left, animated SVG graph right).

Decided visual language, folded into the spec:

- **Layout:** two-column on desktop (lg:grid-cols-2): copy left, graph right.
  Stacks to single-column on mobile/tablet (copy, then graph).
- **Accent gradient:** blue (#3b82f6) -> purple (#a855f7) -> pink (#f472b6),
  applied to BOTH the highlighted path and the headline text (bg-clip-text) so
  they read as one idea.
- **Graph content:** system-paths mesh — nodes ingress / identity / network /
  service / api / edge / data / repo / asset; one highlighted path
  ingress -> identity -> service -> data -> asset. Dimmed edges = the alternate
  paths ("someone else's" route) — visualizes "see every path."
- **Animation:** highlighted path draws in via pathLength; hot nodes spring in
  (staggered) and glow; edges fade in. MotionWrapper/framer-motion idioms.
- **Particles:** PanelParticles sits behind the split content (full-bleed
  layer). Exact particle placement/density alongside the graph is ticket 02.
- **Copy (placeholder, polish is later fog):** headline "See Every Path Into
  Your Systems Before Someone Else Does"; flagship pill "Atlas, Bedrock,
  Keystone"; one-sentence subtext; CTA "Explore the Platform" -> /en/products.

**Rejected:** B (full-bleed graph behind centered copy) and C (horizontal
narrative graph) — preserved as also-rans on the throwaway branch for reference.

**Primary source:** the full 3-variant prototype is captured on the throwaway
branch prototype/hero-graph (see Git capture below); the prototype route is
removed from main. Implementation of the real hero is post-map work, handed off
with this spec.

**Side config change kept on main:** guild-website added to tsconfig.json
exclude (gitignored reference material was polluting local pnpm typecheck;
no CI impact).
