// Server component wrapper for the contact form. Reads the env-configured
// endpoint / Turnstile sitekey / mailto recipient from `site-config.ts` (sourced
// from wrangler `vars` at runtime) and passes them as props to the client form
// — the client never reads `process.env` directly (NEXT_PUBLIC_ is build-time
// inlined on the client and does not reflect runtime wrangler `vars`).

import { contactEndpoint, contactToEmail, turnstileSitekey } from '@/lib/site-config'
import { ContactFormClient } from './ContactFormClient'

export function ContactForm() {
  return (
    <ContactFormClient
      endpoint={contactEndpoint}
      sitekey={turnstileSitekey}
      contactTo={contactToEmail}
    />
  )
}
