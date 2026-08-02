// Contact submission handler — the testable core of the `/api/contact-us` route
// (ticket 14). Pure + injectable: takes the parsed body, an explicit env object,
// and an injectable `fetch` so the boundary test never touches the network.
// The route handler (`src/app/api/contact-us/route.ts`) reads env from
// `process.env` (wrangler `vars` + Worker secrets at runtime) and passes it in.
//
// Contract (shared with ticket 13's form): accepts { name, email, notes,
// 'cf-turnstile-response' }, returns { status: 'success' | 'error', message }.

import { contactSchema } from './contact-schema'

export interface ContactHandlerEnv {
  /** Public Turnstile sitekey. Empty = widget not rendered client-side. */
  turnstileSitekey: string
  /** Turnstile secret. Empty (or sitekey empty) = verification skipped. */
  turnstileSecret: string
  /** Resend API key. Empty (or from empty) = delivery not configured. */
  resendApiKey: string
  /** Resend `from` address (e.g. "Nanisoft <hello@nanisoft.com>"). */
  resendFrom: string
  /** Recipient. Defaults to `resendFrom` when empty. */
  contactTo: string
}

export interface ContactSubmissionResult {
  status: 'success' | 'error'
  message: string
  httpStatus: number
}

interface HandleContactSubmissionArgs {
  name: string
  email: string
  notes: string
  turnstileToken: string
  env: ContactHandlerEnv
  /** Injected so tests avoid the network. Defaults to global `fetch`. */
  fetchImpl?: typeof fetch
}

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const RESEND_URL = 'https://api.resend.com/emails'

/** Verify a Turnstile token server-side. `false` on any non-success. */
async function verifyTurnstile(
  secret: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }).toString(),
    })
    const data = (await res.json().catch(() => null)) as { success?: boolean } | null
    return Boolean(data?.success)
  }
  catch {
    return false
  }
}

/** Deliver the message via Resend. `false` on any non-ok response. */
async function sendViaResend(args: {
  apiKey: string
  from: string
  to: string
  replyTo: string
  name: string
  notes: string
  fetchImpl: typeof fetch
}): Promise<boolean> {
  try {
    const { apiKey, from, to, replyTo, name, notes, fetchImpl } = args
    const res = await fetchImpl(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: replyTo,
        subject: `Contact from ${name}`,
        text: `Name: ${name}\nEmail: ${replyTo}\n\n${notes}`,
      }),
    })
    return res.ok
  }
  catch {
    return false
  }
}

/**
 * Run the contact submission pipeline. Validates the body, verifies Turnstile
 * (skipped when sitekey/secret unset), delivers via Resend, and returns the
 * unified contract. Order: validate → Turnstile → Resend.
 */
export async function handleContactSubmission(
  args: HandleContactSubmissionArgs,
): Promise<ContactSubmissionResult> {
  const { env, turnstileToken, fetchImpl = fetch } = args

  // 1. Validate the body (don't trust the client).
  const parsed = contactSchema.safeParse({ name: args.name, email: args.email, notes: args.notes })
  if (!parsed.success) {
    return { status: 'error', message: 'Please complete all fields correctly.', httpStatus: 400 }
  }
  const { name, email, notes } = parsed.data

  // 2. Turnstile verification — skipped when unprovisioned (sitekey OR secret empty).
  if (env.turnstileSitekey && env.turnstileSecret) {
    if (!turnstileToken) {
      return { status: 'error', message: 'Please complete the bot check.', httpStatus: 400 }
    }
    const ok = await verifyTurnstile(env.turnstileSecret, turnstileToken, fetchImpl)
    if (!ok) {
      return { status: 'error', message: 'Bot verification failed. Please try again.', httpStatus: 400 }
    }
  }

  // 3. Resend delivery — requires API key + from address.
  if (!env.resendApiKey || !env.resendFrom) {
    return {
      status: 'error',
      message: 'Email delivery is not configured yet. Please reach us via the email link.',
      httpStatus: 503,
    }
  }
  const to = env.contactTo || env.resendFrom
  const sent = await sendViaResend({
    apiKey: env.resendApiKey,
    from: env.resendFrom,
    to,
    replyTo: email,
    name,
    notes,
    fetchImpl,
  })
  if (!sent) {
    return { status: 'error', message: 'Something went wrong sending your message. Please try again.', httpStatus: 502 }
  }

  return { status: 'success', message: 'Thanks — we will reach out within a business day.', httpStatus: 200 }
}
