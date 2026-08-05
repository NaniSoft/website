// Homepage trust band — social proof directly below the hero. Industries are
// named as text badges (the honest "trusted by": real logos are fabricated, so
// the segments are named instead). Rendered as a quiet, plain-background row
// labelled with the shared `SectionLabel` primitive.

import { SectionLabel } from '@/components/chrome'

import { TRUST_INDUSTRIES } from './home-content'

export function TrustBand() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14">
      <SectionLabel>Built for teams in environments like these</SectionLabel>
      <div className="flex flex-wrap gap-2.5">
        {TRUST_INDUSTRIES.map(industry => (
          <span
            key={industry}
            className="inline-flex items-center rounded-full border border-zinc-300 px-3.5 py-1.5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            {industry}
          </span>
        ))}
      </div>
    </section>
  )
}
