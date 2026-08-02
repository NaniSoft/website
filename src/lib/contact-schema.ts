// Contact form contract — the single zod schema shared by the contact form
// (ticket 13) and the route handler (ticket 14): same field names, same error
// paths. Pinned `zod ~4.3.6` (nextra constraint — do not bump). The mailto helper
// powers the degradation fallback when the endpoint is unset or the POST errors.

import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name'),
  email: z.email('Please enter a valid work email'),
  notes: z.string().trim().min(1, 'Tell us what you are trying to see'),
})

export type ContactInput = z.infer<typeof contactSchema>

/**
 * Build a `mailto:` href prefilled with subject + body. `to` is optional —
 *  when unset the recipient is left blank (provision NEXT_PUBLIC_CONTACT_EMAIL
 *  to fill it). Uses percent-encoding (not `+`) so email clients decode spaces
 *  and newlines correctly.
 */
export function buildMailtoHref(input: ContactInput, to = ''): string {
  const subject = `Contact from ${input.name}`
  const body = `Name: ${input.name}\nEmail: ${input.email}\n\n${input.notes}`
  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  return `mailto:${to}?${query}`
}
