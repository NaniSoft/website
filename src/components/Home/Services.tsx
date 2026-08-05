// Homepage services — what Nanisoft offers beyond the tools. Four cards
// (Assessment / Implementation / Managed Operation / Open Source Support),
// each a name, a one-line summary, and a short checklist. Quiet plain-bg
// section labelled with the shared `SectionLabel` primitive; accent is the
// mode-tuned lime primary (dots + checkmarks), never a hardcoded hex.

import { SectionLabel } from '@/components/chrome'

import { SERVICES } from './home-content'

export function Services() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14">
      <SectionLabel>How we work with you</SectionLabel>
      <h2 className="mb-8 text-2xl font-medium tracking-tight sm:text-3xl">
        Services around the suite
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map(service => (
          <div
            key={service.name}
            className="flex flex-col rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              <h3 className="text-base font-medium">{service.name}</h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {service.line}
            </p>
            <ul className="mt-auto flex flex-col gap-1.5">
              {service.checks.map(check => (
                <li
                  key={check}
                  className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  {check}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
