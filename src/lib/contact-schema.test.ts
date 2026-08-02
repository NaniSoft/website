import type { ContactInput } from './contact-schema'

import { describe, expect, it } from 'vitest'
import { buildMailtoHref, contactSchema } from './contact-schema'

// External-behavior tests at the src/lib seam. The zod schema is the single
// contract shared by the contact form (ticket 13) and the route handler
// (ticket 14): same field names, same error paths. The mailto helper powers the
// degradation fallback when the endpoint is unset or the POST errors.

const valid: ContactInput = { name: 'Asha Patel', email: 'asha@acme.co', notes: 'Mapping identity drift across tenants.' }

describe('contactSchema', () => {
  it('accepts a valid {name,email,notes}', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an empty name with an error on the name path', () => {
    const r = contactSchema.safeParse({ ...valid, name: '' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some(i => i.path[0] === 'name')).toBe(true)
    }
  })

  it('rejects a whitespace-only name', () => {
    const r = contactSchema.safeParse({ ...valid, name: '   ' })
    expect(r.success).toBe(false)
  })

  it('rejects an invalid email with an error on the email path', () => {
    const r = contactSchema.safeParse({ ...valid, email: 'not-an-email' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some(i => i.path[0] === 'email')).toBe(true)
    }
  })

  it('rejects an empty notes with an error on the notes path', () => {
    const r = contactSchema.safeParse({ ...valid, notes: '' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some(i => i.path[0] === 'notes')).toBe(true)
    }
  })

  it('rejects a missing field entirely', () => {
    const r = contactSchema.safeParse({ name: 'Asha', email: 'a@b.co' })
    expect(r.success).toBe(false)
  })
})

describe('buildMailtoHref', () => {
  it('builds a mailto: with prefilled subject + body and no recipient when `to` is unset', () => {
    const href = buildMailtoHref(valid)
    expect(href.startsWith('mailto:?')).toBe(true)
    expect(href).toContain(encodeURIComponent('Contact from Asha Patel'))
    expect(href).toContain(encodeURIComponent(valid.notes))
    expect(href).toContain(encodeURIComponent(valid.email))
  })

  it('includes the recipient when `to` is provided', () => {
    const href = buildMailtoHref(valid, 'team@nanisoft.com')
    expect(href.startsWith('mailto:team@nanisoft.com?')).toBe(true)
  })
})
