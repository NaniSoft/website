import type { ContactHandlerEnv } from './contact-handler'

import { describe, expect, it, vi } from 'vitest'
import { handleContactSubmission } from './contact-handler'

// Boundary tests at the handler seam. `fetch` is injected (Turnstile verify +
// Resend both call out) so no real network or email is touched. `env` is an
// explicit object so tests don't mutate `process.env`.

const env: ContactHandlerEnv = {
  turnstileSitekey: '0xKEY',
  turnstileSecret: '0xSECRET',
  resendApiKey: 're_key',
  resendFrom: 'Nanisoft <hello@nanisoft.com>',
  contactTo: 'team@nanisoft.com',
}

/** Builds an injected fetch that answers the Turnstile + Resend endpoints. */
function makeFetch(opts: { turnstileOk?: boolean, resendOk?: boolean } = {}) {
  const turnstileOk = opts.turnstileOk ?? true
  const resendOk = opts.resendOk ?? true
  return vi.fn(async (url: URL | RequestInfo, _init?: RequestInit) => {
    const u = String(url)
    if (u.includes('challenges.cloudflare.com/turnstile')) {
      return new Response(JSON.stringify({ success: turnstileOk }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (u.includes('api.resend.com/emails')) {
      return new Response(resendOk ? '{}' : JSON.stringify({ message: 'rejected' }), {
        status: resendOk ? 200 : 422,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response('{}', { status: 200 })
  })
}

const validInput = { name: 'Asha Patel', email: 'asha@acme.co', notes: 'Identity drift across tenants.' }

describe('handleContactSubmission', () => {
  it('succeeds when the Turnstile token verifies and Resend accepts', async () => {
    const fetchImpl = makeFetch()
    const r = await handleContactSubmission({
      ...validInput,
      turnstileToken: 'tok',
      env,
      fetchImpl,
    })
    expect(r.status).toBe('success')
    expect(r.httpStatus).toBe(200)
    // both endpoints were hit
    expect(fetchImpl.mock.calls.map(c => String(c[0]))).toEqual([
      expect.stringContaining('challenges.cloudflare.com'),
      expect.stringContaining('api.resend.com/emails'),
    ])
  })

  it('errors when Turnstile verification fails', async () => {
    const r = await handleContactSubmission({
      ...validInput,
      turnstileToken: 'tok',
      env,
      fetchImpl: makeFetch({ turnstileOk: false }),
    })
    expect(r.status).toBe('error')
    expect(r.httpStatus).toBe(400)
  })

  it('errors when Resend rejects the send', async () => {
    const r = await handleContactSubmission({
      ...validInput,
      turnstileToken: 'tok',
      env,
      fetchImpl: makeFetch({ resendOk: false }),
    })
    expect(r.status).toBe('error')
    expect(r.httpStatus).toBe(502)
  })

  it('skips verification but still succeeds when sitekey/secret are unset', async () => {
    const fetchImpl = makeFetch()
    const r = await handleContactSubmission({
      ...validInput,
      turnstileToken: '',
      env: { ...env, turnstileSitekey: '', turnstileSecret: '' },
      fetchImpl,
    })
    expect(r.status).toBe('success')
    // Turnstile endpoint was NOT hit; only Resend
    const urls = fetchImpl.mock.calls.map(c => String(c[0]))
    expect(urls).toHaveLength(1)
    expect(urls[0]).toContain('api.resend.com/emails')
  })

  it('errors when Resend secrets are unset', async () => {
    const r = await handleContactSubmission({
      ...validInput,
      turnstileToken: 'tok',
      env: { ...env, resendApiKey: '', resendFrom: '' },
      fetchImpl: makeFetch(),
    })
    expect(r.status).toBe('error')
    expect(r.httpStatus).toBe(503)
  })

  it('rejects an invalid body before any network call', async () => {
    const fetchImpl = makeFetch()
    const r = await handleContactSubmission({
      name: '',
      email: 'not-an-email',
      notes: '',
      turnstileToken: 'tok',
      env,
      fetchImpl,
    })
    expect(r.status).toBe('error')
    expect(r.httpStatus).toBe(400)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
