# 11 — Tool-overlay framework + DataGerry mock (first write tool)

**What to build:** The mocked-tool overlay system and the first tool instance — DataGerry/Blueprint schema authoring — which establishes the one-code-path pattern (auto-run mutates programmatically; single-step performs the same canonical act) and the uniform "mocked" overlay chrome every later tool reuses.

**Blocked by:** 10 (Lakehouse state + playbook engine + reactive spine).

**Status:** done — merged to main (merge 760bf80, 2026-08-22). Presentation resolved as split-pane (SPEC §6 carry-forward). One deferred item: human visual confirm of the layout/beckon/field/sync visuals.

- [x] Overlay chrome: title bar = codename + a "mocked" badge; nanisoft tokens; structured-echo fidelity (the real tool's info shape, not its colors/fonts/icons)
- [x] Auto-run = beckon: the active tool's node pulses jade (ripple) to invite a click; overlays do not auto-open mid-run (no stacking); single-step pauses at the beckoning node
- [x] DataGerry mock: schema/type editor — left list of ObjectTypes (`Product`), right pane fields (`id`, `name`, `owner_group` + `Sensitive` added jade); sync-status line animates Bridge → Bedrock (`ext_product` created) → Atlas (SchemaRegistry refreshed)
- [x] Canonical action (single-step): add the `Sensitive: bool` field to the `Product` ObjectType — the definitional hinge
- [x] One code path: auto-run performs the same mutate the canonical action does; state writes `SchemaRegistry[Product].fields += {Sensitive:bool}` and the Bridge writes the `ext_product` table schema; reads none (origin)
- [x] Clicking the DataGerry full-UI node opens the overlay; presentation (modal vs inline-expand vs split-pane) is a build choice — pick one and note the decision