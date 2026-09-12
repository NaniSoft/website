---
name: nanisoft — digital twin of the IT estate
description: The Living Map — petrol-and-bone cartography for a queryable IT-estate twin; flat, pill-and-card geometry, jade reserved for the live pulse.
colors:
  petrol: "#0C2A33"
  petrol-mid: "#15414A"
  petrol-deep: "#08222A"
  petrol-soft: "#3C6770"
  petrol-tint: "#8FB0B6"
  bone: "#F4EFE6"
  bone-elev: "#FBF7EF"
  bone-sunken: "#EAE2D3"
  ink: "#102A30"
  ink-muted: "#4A5E64"
  teal: "#2A8C97"
  teal-bright: "#4DB0BB"
  jade: "#14A77A"
  jade-strong: "#0E8A62"
  focus: "#1F6E78"
  success: "#10A48B"
  warning: "#D08C1A"
  danger: "#D43A3A"
typography:
  display:
    fontFamily: "Satoshi, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(34px, 5vw, 56px)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Satoshi, system-ui, -apple-system, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Satoshi, system-ui, -apple-system, sans-serif"
    fontSize: "22px"
    fontWeight: 600
  body:
    fontFamily: "Satoshi, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.16em"
  data:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
rounded:
  card: "20px"
  inner: "12px"
  pill: "9999px"
spacing:
  stack: "8px"
  gap: "16px"
  gutter: "24px"
  block: "48px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.petrol}"
    textColor: "{colors.bone}"
    rounded: "{rounded.pill}"
    height: "32px"
    padding: "0 16px"
  button-primary-dark:
    backgroundColor: "{colors.bone-elev}"
    textColor: "{colors.petrol}"
    rounded: "{rounded.pill}"
    height: "32px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.bone-elev}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  card-dark:
    backgroundColor: "{colors.petrol-mid}"
    textColor: "{colors.bone}"
    rounded: "{rounded.card}"
    padding: "24px"
  tag-mono:
    backgroundColor: "{colors.bone-sunken}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
  input:
    backgroundColor: "{colors.bone-elev}"
    textColor: "{colors.ink}"
    rounded: "{rounded.inner}"
    height: "32px"
---

# Design System: nanisoft

## Overview

**Creative North Star: "The Living Map"**

nanisoft renders an IT estate the way a good chart renders a coastline: precisely, calmly, and visibly alive. Every surface is cartography — petrol water, bone paper, teal contour lines — and the estate itself is the subject: a graph that breathes, traverses, and answers. The system's warmth comes from bone, never from decoration; its authority comes from the mono data face that annotates the map like a surveyor's hand.

The aesthetic philosophy is **engineered restraint**. Surfaces are flat and honest: depth is tonal, borders are hairlines, geometry does the work. Color appears only where state lives — the palette's single green accent is a pulse, not a paint. Nothing is ornamented that the twin cannot show; the map earns trust the same way the product does, by being produced rather than assembled.

Density is airy and editorial at the section level (96px vertical rhythm, generous 1200px containers) and compact inside components (24px card padding, 16px grid gaps). The tone is confident, factual, and slightly warm — a field instrument with a paper texture.

**Scope: one world, four surfaces.** This file is the brand standard for every nanisoft app — landing, docs, blog, and playground — each of which consumes `@nanisoft/identity` directly, so the values below are shared verbatim, never re-implemented. The component and layout sections document the landing's expression of the system (it is the flagship surface); the other apps adapt the same primitives to their own density and reading needs without inventing new values, new radii, or new hues.

**Key Characteristics:**
- Two-mode world, one identity: bone-warm light mode, petrol-deep dark mode; the interactive base monochrome-inverts between them
- Shape lock of three radii only — card 20, inner 12, pill — with pills for both buttons and tags
- Flat by design: zero shadows; depth is tonal layering plus 1px hairlines
- One accent (jade) reserved exclusively for live/active states — it never decorates
- Two typefaces with a strict division of labor: Satoshi speaks, JetBrains Mono measures
- The hero is a forced-dark full-bleed map panel in both page modes, with a living canvas DAG

## Colors

The palette is mineral and maritime — deep petrol water against warm bone paper, with survey teal as the working mark and signal jade as the only pulse. Every value below lives in `@nanisoft/identity` (single source of truth, test-enforced); the landing re-expresses them as semantic CSS custom properties, never new hexes.

### Primary
- **Deep Petrol** (#0C2A33): the dark base — dark-mode backgrounds, ink-adjacent text on bone, and the light-mode interactive fill. The estate's deep water.
- **Warm Bone** (#F4EFE6): the light base — page background in light mode, text in dark mode, and the dark-mode interactive fill. Never pure white; bone is the lightest the system goes.
- **Bone Elevated** (#FBF7EF): raised light surface — cards, inputs, and the dark-mode button fill. Near-white without being white.
- The interactive base **monochrome-inverts per mode**: petrol fill with bone text in light, bone fill with petrol text in dark. Both are "primary"; neither is an accent.

### Secondary
- **Survey Teal** (#2A8C97): the supporting mark — done edges, illustrative washes, flagship status, info. Works in both modes unchanged.
- **Survey Teal Bright** (#4DB0BB): teal lifted for dark surfaces — secondary marks on petrol, dark-mode focus ring.

### Tertiary
- **Signal Jade** (#14A77A): the one accent. Live/active states only — the traversing wavefront, active edges, active links, Run buttons. It is never decorative, never a status color, never a surface.
- **Signal Jade Deep** (#0E8A62): jade darkened for active strokes on light surfaces.

### Neutral
- **Ink** (#102A30): body text on bone — near-black petrol, not black.
- **Muted Ink** (#4A5E64): secondary text on bone.
- **Petrol Mid** (#15414A): elevated dark surface (dark-mode cards).
- **Petrol Deep** (#08222A): sunken dark surface — wells and recesses on petrol.
- **Petrol Soft** (#3C6770): hairline borders and secondary marks on dark; the dark-mode border color.
- **Petrol Tint** (#8FB0B6): muted text on petrol (dark surfaces).
- **Bone Sunken** (#EAE2D3): sunken light surface and the light-mode hairline border.
- **Focus** (#1F6E78): light-mode focus indicator, a darkened teal chosen because brand teal/jade fail 3:1 on bone. Dark mode reuses Survey Teal Bright.
- **Success** (#10A48B) / **Warning** (#D08C1A) / **Danger** (#D43A3A): functional statuses — not brand hues, carried outside the identity package until a token decision lands.

### Named Rules
**The One Pulse Rule.** Signal Jade appears only where the system is alive right now: the active edge, the active link, the Run button. If nothing is running, there is no jade on the screen. Its rarity is the point.

**The Monochrome Inversion Rule.** The interactive base inverts per mode — petrol-on-bone in light, bone-on-petrol in dark — so buttons are always the highest-contrast object on the page. Content sitting on a jade fill is petrol in *both* modes (role.onAccent, ~4.9:1); bone on jade fails light mode at ~2.7:1.

**The Honest Status Rule.** Status is teal-washed or muted, never green-flagged: the flagship use-case reads as a 14% teal wash, "Planned" as sunken bone. Status must not borrow the accent's authority — a roadmap item that glowed like a live edge would be a lie.

## Typography

**Display Font:** Satoshi (voice — headings, UI, body; self-hosted Fontshare woff2, fallback system-ui)
**Body Font:** Satoshi (same family; the voice does the talking)
**Label/Mono Font:** JetBrains Mono (the twin's data face — tables, query, logs, node labels)

**Character:** A geometric-humanist sans paired with a workmanlike mono: Satoshi carries warmth and argument, JetBrains Mono carries evidence. Emphasis is the italic of the same family — never a swapped-in serif, never a color change.

### Hierarchy
- **Display** (700, clamp(34px–56px), 1.06, −0.015em): the hero statement only, capped at ~14ch so it sets like a title block on the map.
- **Headline** (700, 40px, 1.15): section h2s; every section earns exactly one.
- **Title** (600, 22px; 600, 18px in tighter cards): card and subsection titles.
- **Body** (400, 16px, 1.6; leads at 18px): running copy. Leads use `text-wrap: pretty`, headings `balance`; block widths stop at 640–720px.
- **Label** (JetBrains Mono 400, 11–12px, +0.16em, uppercase): eyebrows, step tags — cartographic annotations, not decoration.
- **Data** (JetBrains Mono): anything the twin produces — tables, query text, logs, node labels, step numbers.

### Named Rules
**The Two Faces Rule.** Satoshi speaks; JetBrains Mono measures. If a string is *from the system* (a reading, a step, a label on the map), it is mono. If it is *about the system* (an argument, a promise), it is Satoshi. Emphasis is italic of whichever face is already speaking.

## Layout

The landing's spatial grammar: a single centered container system on a 96px vertical rhythm. (Other apps keep this rhythm, container discipline, and hairline separations, adapting columns to their own content.) Sections use `padding: 96px 24px` with content capped at 1200px (the hero panel at 1240px; the contact section narrows to 640px as a reading measure). Inside sections, CSS grids of 3–4 columns with 16–24px gaps hold the card population.

The hero is a two-column grid — copy at 2fr, the living DAG at 3fr — with a `clamp(32px, 5vw, 72px)` gap, stretching to a `min(88vh, 860px)` band. Grids collapse in two steps: 4→2 at 900px, →1 at 600px; 3-col grids fall 3→1 in a single step at 900px. The hero stacks at 719px with the canvas given `clamp(360px, 50vh, 520px)` of height.

The top nav is sticky at 64px: transparent over the hero, then after 8px of scroll it grows a glass surface — 80% page background via `color-mix`, `blur(12px) saturate(160%)`, and a 1px hairline. Brand sits left (wordmark, 1px rule, tagline at the `--text-xs` stop that drops below 1023px); nav links at muted 500-weight; the theme toggle alone on the right.

Observed breakpoints: 1023px and 639px (nav reflow), 900px/600px (grids), 719px (hero stack), 899px (footer stack).

## Elevation & Depth

The system is flat by design and contains **zero box-shadows** — not low shadows, none. Depth is conveyed by the tonal trio: content rests on the elevated surface against the page background, wells and illustrations sink into the sunken surface, and 1px hairline borders (Bone Sunken in light, Petrol Soft in dark) do the separating. The only blur in the system is the scrolled nav's glass. The hero adds one exception-as-texture: a bone-dot grain (a 3px radial-gradient dot grid at 5% opacity) over petrol, like paper tooth on a chart — depth as material, not as shadow.

### Named Rules
**The Flat Estate Rule.** Surfaces are flat at rest and in every state. If a design needs a shadow to separate, it hasn't used the tonal trio: lift with `--color-bg-elev`, sink with `--color-bg-sunken`, divide with a 1px hairline.

## Shapes

One corner-radius system, locked: **cards at 20px, inner elements at 12px, buttons as full pills** (9999px). Tags and chips are pills too — the pill is the shape of anything pressable or label-like. Borders are always 1px hairlines, never chunky strokes. Focus is a 2px outline in the mode-appropriate focus color with 2px offset, **following each element's own radius** — the outline never overrides geometry, so a pill keeps its pill while focused. Mixed corner systems are banned by the identity package's tests, not just by taste.

## Components

The landing is the canonical expression of every component below; docs, blog, and playground reuse the same primitives through `@nanisoft/identity` rather than restyling them.

### Buttons
- **Shape:** full pill, radius = control height (antd `shape="round"`, pinned app-wide by `PillButton` so it cannot be forgotten per-instance)
- **Primary:** Deep Petrol fill + Warm Bone text in light mode; inverts to Bone Elevated fill + petrol text in dark. ~32px control height, ~16px horizontal padding.
- **Hover / Focus:** antd state treatments on the token colors; focus is the 2px focus-color outline at 2px offset.
- **Text/ghost:** nav group triggers are borderless text buttons in Muted Ink at 500 weight; loading submits keep their pill and show the antd spinner.

### Tags / Chips
- **Step tags** (`01`–`04`): JetBrains Mono, pill, sunken background, muted text, hairline border — a surveyor's plate number, explicitly *not* the accent.
- **Status tags:** pills with no border — "Flagship · available today" as a 14% Survey Teal wash, "Planned" as sunken bone, per the Honest Status Rule.

### Cards / Containers
- **Corner Style:** 20px card radius
- **Background:** elevated surface (Bone Elevated / Petrol Mid); use-case cards begin with a 200px illustration cover of quiet teal/petrol washes over the sunken surface, then a 24px body — jade never appears in illustrations
- **Shadow Strategy:** none — see The Flat Estate Rule
- **Border:** 1px hairline (outlined antd variant)
- **Internal Padding:** 24px

### Inputs / Fields
- **Style:** antd inputs on the elevated surface, 12px inner radius, 1px hairline borders, vertical labels (contact form is the only form on the site)
- **Focus:** antd active-border in the mode's primary color plus the global 2px focus ring
- **Error / Disabled:** antd default treatments over token colors; errors are sentence-case, specific ("Enter a valid email")

### Navigation (landing TopNav)
Sticky 64px header: transparent over the hero, glass after 8px of scroll. Left: wordmark (26px, inline SVG set in Satoshi), a 1px vertical rule, and the `--text-xs` tagline. Center-left: dropdown groups (Product, Docs — hover and click) rendered as borderless text triggers, plus flat links (Blog, About us, Contact us), all Muted Ink at 500 weight and shifting to full ink on hover. Right: theme toggle, whose switch runs the **resurvey wipe** — the new mode is revealed in a circle expanding from the pointer (View Transitions API, brand easing), the map redrawn rather than swapped; instant under reduced motion or where the API is absent. The playground pill is deliberately absent — the site's single ask lives in the final section and footer.

### Signature: The Living Map hero (landing)
The page opens on a full-bleed petrol panel forced dark **in both page modes**: the semantic tokens are re-declared on the `.hero` class, so the canvas DAG and every child render their dark appearance without a single hardcoded hex. Bone-dot grain textures the panel; an **announcement pill** — the panel's one editorial object, a surveyor's plate of petrol-mid chip, hairline, mono annotation, and a survey-teal dot linking the latest real field note on the blog — sits above the mono eyebrow ("nanisoft · the living twin"), which precedes the display statement with its italic emphasis; the right three-fifths is a breathing canvas DAG of the digital-twin pipeline animated by the identity motion variants (breathe / traverse / ripple, all transform+opacity only, single easing `cubic-bezier(.32,.72,0,1)`, fully static under reduced motion). The hero carries no buttons and no product CTA — one story, told as a map; the pill points at evidence, never at an ask.

### Pillar tabs (landing Platform)
The platform's capability blurbs render as three pillar tabs on the antd `Segmented` control, pinned by the shared theme: the **active segment follows the Monochrome Inversion Rule** — petrol fill with bone text in light, bone fill with petrol text in dark — because a selected tab is a choice, not a live edge; jade never appears in it. Each panel shows two capability entries separated by a 1px hairline, closed by the mono annotation naming the real components that carry the pillar.

### Survey plate (landing Integrations)
The section's closing factual beat: the platform's own verifiable readings (16 oss products carried · 8 under codenames · 4 built in-house · 0 forks) on a hairline-ruled strip — figures in JetBrains Mono with tabular numerals, labels as mono uppercase annotations. No trend arrows, no user counts: the system publishes no history and no customers, and inventing either would break the Honest Status Rule.

### Wordmark (shared — `@nanisoft/identity`)
Inline SVG `<text>` set in Satoshi, re-pointed at the loaded webfont via CSS so the mark renders in the real face; dark and light modes, with a forced-dark form for dark surfaces like the hero. One wordmark, rendered by every app.

## Do's and Don'ts

### Do:
- **Do** keep the shape lock: card 20 / inner 12 / pill for every corner in the system — no fourth radius ever.
- **Do** treat jade as a pulse: live edges, active links, Run buttons only; content on a jade fill is petrol, never bone.
- **Do** use JetBrains Mono for anything the twin produces — tables, query, logs, step numbers, node labels, eyebrows.
- **Do** force a dark section by re-declaring the semantic tokens on its class (the `.hero` pattern), never by hardcoding hexes in a component.
- **Do** separate surfaces tonally — elevated on `--color-bg-elev`, sunken into `--color-bg-sunken`, divided by 1px hairlines.
- **Do** pick type sizes from the scale (`--text-xs` … `--text-display`); the named stops are the only sizes.

### Don't:
- **Don't** use pure black (#000000) or pure white (#FFFFFF) — Ink and Warm Bone are the bounds of the world.
- **Don't** introduce purple or neon hues — the identity package's test suite guards them out.
- **Don't** add box-shadows for depth; if separation is missing, the tonal trio and a hairline haven't been used yet.
- **Don't** let jade become a background, border, text, or status color — the identity package exposes it only through the accent role, and that is what keeps the One Pulse Rule enforceable.
- **Don't** swap in a serif for emphasis — italic of the same family only.
- **Don't** put the playground CTA in the hero; the site has one ask, and it lives at the close. (The hero's announcement pill is the sanctioned exception to "nothing asks in the hero" — it is editorial, not a product ask.)
