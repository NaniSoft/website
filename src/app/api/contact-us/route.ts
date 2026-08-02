// /api/contact-us — in-app Next.js route handler deployed with the `nanisoft`
// Cloudflare Worker via OpenNext (no separate service). Verifies the Turnstile
// token server-side, delivers via Resend, and speaks the unified
// { status, message } contract the contact form (ticket 13) reads.
//
// Env: public vars in wrangler.jsonc (NEXT_PUBLIC_TURNSTILE_SITEKEY,
// NEXT_PUBLIC_CONTACT_ENDPOINT) + Worker secrets (TURNSTILE_SECRET_KEY,
// RESEND_API_KEY, RESEND_FROM_ADDRESS, CONTACT_TO_ADDRESS) set via
// `wrangler secret put`. Read at runtime from process.env (OpenNext populates
// it from the Worker env). The testable core lives in @/lib/contact-handler.

import type { ContactHandlerEnv } from '@/lib/contact-handler'

import process from 'node:process'
import { NextResponse } from 'next/server'
import { handleContactSubmission } from '@/lib/contact-handler'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) {
    return NextResponse.json(
      { status: 'error', message: 'Invalid request body.' },
      { status: 400 },
    )
  }

  const name = String(body.name ?? '')
  const email = String(body.email ?? '')
  const notes = String(body.notes ?? '')
  const turnstileToken = String(body['cf-turnstile-response'] ?? '')

  const env: ContactHandlerEnv = {
    turnstileSitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY ?? '',
    turnstileSecret: process.env.TURNSTILE_SECRET_KEY ?? '',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    resendFrom: process.env.RESEND_FROM_ADDRESS ?? '',
    contactTo: process.env.CONTACT_TO_ADDRESS ?? '',
  }

  const result = await handleContactSubmission({ name, email, notes, turnstileToken, env })
  return NextResponse.json({ status: result.status, message: result.message }, { status: result.httpStatus })
}
