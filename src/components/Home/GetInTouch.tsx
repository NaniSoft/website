// Homepage get-in-touch — the working ContactForm re-skinned into the shared
// GetInTouch chrome. Heading + copy on one side, the real ContactForm on the
// other. The `#get-in-touch` anchor is what the navbar "Contact" link points
// at (and what `e2e/contact.spec.ts` drives), so it must stay. The form's
// Turnstile + Resend + `/api/contact-us` backend is untouched — only the
// surrounding panel is re-skinned; the ContactForm component itself is kept
// and restyled in a later ticket. The headline accent is a token gradient
// (lime → cyan → navy, the cool/acid ramp), never a hardcoded hex.

import { SectionLabel } from '@/components/chrome'
import { ContactForm } from '@/components/ContactForm'

export function GetInTouch() {
  return (
    <section id="get-in-touch" className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="grid overflow-hidden rounded-2xl border border-zinc-200 lg:grid-cols-2 dark:border-zinc-800">
        <div className="border-b border-zinc-200 p-8 lg:border-b-0 lg:border-r dark:border-zinc-800">
          <SectionLabel>Get in touch</SectionLabel>
          <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">
            See your own
            {' '}
            <span className="bg-linear-to-r from-core via-ingestion to-platform bg-clip-text text-transparent">
              attack paths
            </span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            Tell us what you are trying to see. We will walk you through how
            Atlas maps the routes through your systems — and what it would take
            to run the suite against your live graph.
          </p>
        </div>
        <div className="bg-beige-100 p-8 dark:bg-white/5">
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
