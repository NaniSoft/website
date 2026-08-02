# Form stack: mirror guild (formik+yup) or our stack (rhf+zod)

Type: grilling
Status: closed
Blocked by: (none)
Assignee: claude
Resolved: 2026-08-02 — Decision recorded after a 6-branch grilling; user confirmed.

## Question

Do we mirror the guild codebase's form stack — **formik + yup**, as in
`guild-website/ui/get-in-touch-section.tsx` — or use **react-hook-form + zod**, since
`zod` ~4.3.6 is already pinned here and `CLAUDE.md` favors minimal deps / staying
idiomatic to our stack?

Both produce the same UX: validated name/email/notes fields, Cloudflare Turnstile, submit
to an env-configured endpoint, success state. Guild also uses `react-confetti` for the
contact success state and `react-hot-toast` for the newsletter toast — those are two
small deps to accept **regardless** of the form-stack choice.

**Recommendation:** react-hook-form + zod — avoids two new deps (formik, yup), stays
idiomatic to our stack, and `zod` is already pinned. Behavior still mirrors guild.

This blocks the backend-provisioning ticket (04), since the form's submit target is
decided next.

## Resolution

Decided via grilling (6 branches, all resolved). Net-new dependencies: **exactly one —
`react-hook-form`.** `zod` reused (pinned ~4.3.6), `sonner` reused (already mounted
globally in the layout), Shadcn `Form`/`Input`/`Button` primitives reused. **Rejected:**
formik, yup, react-hot-toast, react-confetti, any Turnstile React lib.

**Contact form** (3 fields + Turnstile):

- **react-hook-form + zod** for state + validation. Built on the existing Shadcn form
  primitives. Schema is `{ name, email, notes }` — the Turnstile token is **not** a
  modeled field (read at submit time, see below).
- Success = `sonner` success toast + inline "Thank you, we'll contact you soon" panel.
  Error = `sonner` error toast + inline message with a `mailto:` link. **No confetti.**

**Newsletter** (single email field):

- **Raw `<form>`** (no form library) + a one-line `z.string().email()` zod check on
  submit. Mirrors guild's asymmetry (guild's newsletter is also a raw form). Shares the
  zod validation layer and the sonner feedback layer with the contact form, so the
  codebase stays coherent even though the form-state layer differs.

**Feedback layer:** reuse **`sonner`** (`toast.success/error` against the existing global
`<Toaster position="top-center" />`). No `react-hot-toast` — one toast system on the page.

**Turnstile (client integration only — sitekey/secret/server verification are ticket 04):**

- **Raw `<div class="cf-turnstile" data-sitekey={env}>`** + Cloudflare's script loaded once.
  No Turnstile React lib.
- Sitekey env-gated via `NEXT_PUBLIC_TURNSTILE_SITEKEY`: unset → widget not rendered.
- Token read at submit time from the Turnstile-injected hidden `cf-turnstile-response`
  input; rides along in the POST payload, stays out of the rhf schema.

**Submit / endpoint contract (fixed here for ticket 04 to match):**

- Both forms POST JSON to env-configured URLs: `NEXT_PUBLIC_CONTACT_ENDPOINT`,
  `NEXT_PUBLIC_NEWSLETTER_ENDPOINT`.
- Contact payload: `{ name, email, notes, 'cf-turnstile-response': token }`.
  Newsletter payload: `{ email }`.
- **Unified response shape for both:** `{ status: 'success' | 'error', message: string }`
  → one shared response handler drives sonner toasts + inline states.
- **Degradation when env unset:** contact → `mailto:` fallback (URL prefilled with
  name/email/notes, per map spec #7); newsletter → graceful "coming soon" state (or the
  section self-omits).

**Fog cleared/refined:** the map's "perf/bundle impact of any new deps" fog item is
refined — react-confetti, react-hot-toast, and formik+yup were all rejected, so the only
additions are `react-hook-form` (small) and the Turnstile script (loaded once, only when
the sitekey env is set). Remaining bundle concern now hinges only on ticket 04.

**Unblocks:** ticket 04 (backend provisioning), now frontier. 04's env var names are
aligned to this contract (`NEXT_PUBLIC_CONTACT_ENDPOINT`, `NEXT_PUBLIC_NEWSLETTER_ENDPOINT`,
`NEXT_PUBLIC_TURNSTILE_SITEKEY`).

**Update 2026-08-02 (scope change):** the **newsletter half of this decision is deferred**
(see the map's Out of scope). The "newsletter stays a raw `<form>` with a zod email check"
and `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` / coming-soon-fallback provisions are no longer part
of this effort. The contact-form half of this decision (rhf + zod, sonner, raw Turnstile,
unified `{status,message}` contract, `mailto:` fallback) stands unchanged.
