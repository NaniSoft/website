Type: prototype
Status: closed
Blocked by:

## Question

The nanisoft brand is **greenfield** — no existing logo, palette, wordmark, or tone. Use the **taste flow** (`design-taste-frontend` for direction / anti-slop / brief-inference, `high-end-visual-design` for the spectacle + motion language, `ui-ux-pro-max` for token/motion presets) to create a rough, concrete identity artifact to react to:

- **Wordmark** options for "nanisoft" (2–3 directions).
- **Palette** + **typography** grounded in the subject (digital twin of an IT estate — connected systems, data lake, cybersecurity) rather than generic cyber clichés.
- **Motion language** for the reactive digital-twin graph hero (mouse-reactive, lively, no buttons) and the scroll-animated architecture section.
- **Tone of voice** for the landing copy.

This is a *prototype* (HITL): raise the fidelity of the discussion with a cheap, rough, concrete artifact (a style tile / wordmark options / palette + motion notes). Link the artifact from this ticket. The decision recorded on resolution: the chosen identity direction that both the landing and the playground apply.

## Answer

**Direction locked: "The Living Map."** Held as the identity for both the landing and the playground (user confirmed: hold the direction, no redirect).

**Artifact:** `.scratch/nanosoft-digital-twin/prototypes/03-identity-style-tile.html` (throwaway style tile; open in a browser, no build).

**Wordmark — W1 "node + flow" locked.** Satoshi 700, tight tracking; the "i" dot expressed as a ringed graph node with a live (teal, dashed) connection trailing right. Accent (jade) reserved for the active link only. (W2 continuous stroke and W3 monogram lockup were the runner-ups; W3's node-built "n" monogram is kept on file as the favicon / app-bar / playground-dock fallback — not the primary wordmark.)

**Palette (tokens, locked everywhere):** petrol `#0E2A33` (deep base / "the lake"), petrol-2 `#143742` (elevated on dark), bone `#F4EFE6` (light surface), bone-2 `#FAF7F1` (elevated on light), ink `#0A1F26` (text on light), muted `#5B7785` / muted-d `#8FB3BD`, teal `#2DD4BF` (secondary signal), **jade `#34D399` = the single accent (live/active/now only)**. No purple, no neon, no pure black/white. Shape lock: cards 20px, inner 12px, buttons full-pill.

**Typography:** Satoshi (humanist grotesk) for voice + JetBrains Mono for the twin's data (table names, node IDs, query fragments); italic carries emphasis; no serif. Scale: Display 38 / Heading 22 / Body 16 / Mono 13 / Eyebrow 11 tracked.

**Motion language (four principles):** *breathe* (idle nodes drift on a slow 4–6s sine, never linear), *traverse* (a bright dot rides each directed edge on a staggered cycle = a phase moving through the spine), *ripple* (cursor repels nearby nodes; click sends a jade ring outward), *settle* (everything eases on `cubic-bezier(.32,.72,0,1)` — mass, not snap; buttons press 2px and bounce). `prefers-reduced-motion`: graph holds still, ripples disabled, reveals instant.

**Tone of voice:** plain, confident, never breathless. No "seamless/unleash/next-gen"; verbs concrete; subject is always the estate + its connections. Headline: *"Every connection in your estate, in one living model."*

**Hero graph — directed acyclic pipeline (revised from the original scattered mesh per user feedback).** The hero is a left-to-right DAG of the real architecture, not a decorative mesh: columns = pipeline stages (AD/Workday/SQL Fleet → Blueprint/Trailhead → Bedrock → Forge → Overlook → Atlas+OPA → Compass), edges = directed data flow with **orthogonal routing (straight lines + soft 90° bends, ~12px rounded corners) and arrowheads**. A **wavefront pulse** flows left-to-right on a 6s cycle (jade dot per edge, staggered by column) so a coherent batch is seen moving *through* the pipeline. Watchtower sits above as a cross-cutting observer with dashed lines down to Bedrock + Forge. Hubs (Atlas, Compass, Bedrock) carry a persistent ring. Layout: graph starts at ~53% width and centers at ~58% height so the source-column labels clear the headline text.

**Brand application to each surface (fog graduated):** the prototype includes rough previews — hero (mouse-reactive twin, no buttons), architecture section (SCHEMA→INGEST→TRANSFORM→INVESTIGATE chips, active phase lights jade, travelled edges glow teal), playground tool chips (status with intent: jade=live, teal=running, muted=idle). This grounds the identity on all three surfaces; no longer fog, now specifiable detail for the handoff spec.

**Note on method:** resolved without vision — the prototype was reviewed entirely through text (the agent read the HTML, the human confirmed the render). No image visualization was needed or used.