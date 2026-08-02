# Marketing sections + particles placement prototype

Type: prototype
Status: closed
Blocked by: (none)
Assignee: claude
Resolved: 2026-08-02 — Variant A chosen

## Question

How should the marketing sections look so they **blend with the existing theme, tokens,
and tsparticles**, and **where do `PanelParticles` live** on the marketing homepage given
the instruction not to remove them?

Sections to prototype together (one coherent visual treatment):

1. **Trust strip** — industry-segment badges (Financial Services, Healthcare, Critical
   Infrastructure, Government, Retail), framed as "built for teams operating in
   environments like these." NOT a logo marquee — no fabricated logos. Reference for
   structure only: `guild-website/ui/client-logos-section.tsx`.
2. **Products grid** — collapsible `<details>` per category (Core, Ingestion, Query &
   Traversal, Interfaces, Platform & Trust) like `guild-website/ui/ecosystem.tsx`. Cards
   = name + one line, linking to `/en/products#anchor`. **No product logos** (Nanisoft
   products are internal suite pieces, not separate brands with logos).
3. **Services** — 4 cards (Assessment / Implementation / Managed Operation / Open Source
   Support), name + one line each. Reference: `guild-website/ui/services-section.tsx`.
4. **Get in touch + Newsletter** — mirror the layout/feel of
   `guild-website/ui/get-in-touch-section.tsx` and `guild-website/ui/components/newsletter.tsx`,
   implemented in our stack.

And the **particles placement** decision: hero background, full-page background, or
specific sections? Particles stay; this only decides where.

Raise a cheap prototype of the section treatment + particles placement to react to. All
implemented in our stack (Shadcn/Tailwind 4/our tokens), not `@theguild/components`. Link
the prototype artifact on resolution.

## Resolution

**Variant A wins — "Hero-only particles, compact editorial."**

PanelParticles live ONLY behind the hero. The marketing sections below sit on a plain
background in a single dense column (max-w-5xl): trust strip (row) -> products grid
(collapsible <details> per category) -> services (4 cards, cols=4) -> get in touch ->
newsletter. Quiet, dense, readable; the hero is the one moment with motion/particles.

Why A over B/C:

- **B (section-backed)** double-dips motion — particles under both the hero AND the
  product/service bands competes with the hero graph as the page's signature. The
  frontend-design "spend boldness in one place" rule says pick one ambient moment.
- **C (full-page faint)** reads as generic dashboard ambient and fights the editorial
  copy density; a fixed low-opacity layer behind everything is the AI-default "particles
  site" look.
- **A** keeps particles as the hero's exclusive atmosphere and lets the sections do the
  talking — the accent gradient (blue->purple->pink) carries the signature down the page
  quietly via accent dots + the hero headline clip + the primary CTA, so the page stays
  cohesive without a second particles layer.

Section treatment decisions locked alongside the placement:

- **Trust strip** = industry-segment BADGES (Financial Services, Healthcare, Critical
  Infrastructure, Government, Retail), framed "built for teams in..." — NOT a logo
  marquee. Variant A uses the compact inline 'row' form.
- **Products grid** = collapsible <details open> per the 5 categories, cards = name +
  one line linking to /en/products#anchor. No product logos.
- **Services** = 4 cards (Assessment / Implementation / Managed Operation / Open Source
  Support), name + one line + checklist, cols=4.
- **Get in touch** = rounded panel, heading+copy | stub form (success state on submit,
  dashed Turnstile placeholder where ticket 04's sitekey lands). Real stack/endpoint =
  tickets 03/04.
- **Newsletter** = rounded panel, email + subscribe -> toast.success. Stub endpoint,
  env-configured later.

Content (21 product names/one-liners, 4 services) is PLACEHOLDER — final copy polish is
a fog item, not part of this ticket.

**Prototype artifact:** branch 'prototype/marketing-sections' (3 variants, switchable
via ?variant=A|B|C on /en/prototype-sections + floating switcher / arrow keys).
Verified pnpm typecheck + pnpm exec eslint clean. Main cleaned; only the decision kept.
