# 13 — Contact form client

**What to build:** A validated "Get in touch" form a visitor can actually use. Name/email/notes, inline validation, Cloudflare Turnstile bot-protection (when provisioned), and a clear success state. When the endpoint or sitekey is unprovisioned it degrades gracefully — no broken form. This ticket defines the unified `{ status, message }` submit contract that the server (ticket 14) implements.

**Blocked by:** 07 — Foundation (clean shell; `sonner` Toaster already mounted globally).

**Status:** ready-for-agent

- [ ] Form (name/email/notes) built with react-hook-form + the pinned `zod ~4.3.6` on existing Shadcn form primitives. Net-new dep: exactly `react-hook-form` (no formik/yup).
- [ ] Raw Cloudflare Turnstile widget (`<div class="cf-turnstile" data-sitekey={env}>` + script loaded once; no Turnstile React lib). `NEXT_PUBLIC_TURNSTILE_SITEKEY` unset → widget not rendered (form still posts). Token read at submit from the hidden `cf-turnstile-response` input and rides in the POST payload (not a modeled zod field).
- [ ] Feedback via existing `sonner` `toast.success/error` against the global `<Toaster position="top-center" />` (no `react-hot-toast`, no `react-confetti`).
- [ ] Submit: POST JSON `{ name, email, notes, 'cf-turnstile-response': token }` to `NEXT_PUBLIC_CONTACT_ENDPOINT` (`/api/contact-us`); unified response shape `{ status: 'success' | 'error', message: string }` drives toasts + inline states.
- [ ] Degradation: `NEXT_PUBLIC_CONTACT_ENDPOINT` unset → `mailto:` link prefilled with name/email/notes; on error response → inline message + `mailto:` fallback.
- [ ] Vitest at the `src/lib` seam for the zod schema: accepts valid `{name,email,notes}`; rejects empty name, invalid email, missing fields with the right error paths.
- [ ] `pnpm check` green.
