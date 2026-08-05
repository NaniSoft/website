// Homepage newsletter — the shared `NewsletterPlaceholder` chrome primitive
// in its full-band layout: a full-bleed bright-lime band that closes the
// homepage. The primitive owns its copy, layout, and the no-op email form
// (no submit wired — placeholder for layout review); this section is only a
// full-width structural wrapper so the band can break out of the max-w-6xl
// column the other homepage sections sit in.

import { NewsletterPlaceholder } from '@/components/chrome'

export function Newsletter() {
  return (
    <section className="w-full">
      <NewsletterPlaceholder layout="full-band" />
    </section>
  )
}
