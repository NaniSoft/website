'use client'

// /en/changelog — editorial chrome with a tabbed filter (variant C carry-forward,
// impl ticket 07) over the typed reverse-chronological data module. The filter is
// client-side state over a static list (no per-entry routes, no server round-trip),
// so the component is a client component; the data module stays the single source.
//
// Each entry renders its kind pill, the long author · date row, and the framing
// body sections (h3s) — the structure the e2e pages spec asserts against. The
// filter is a group of toggle buttons (`aria-pressed`) rather than a tabs pattern:
// it narrows the list below, it does not switch panels, so the ARIA APG models
// this as a `role="group"` of toggles, not `role="tablist"`. The active toggle uses
// the mode-tuned lime primary. Links inherit the global `.hive-focus` ring.

import type { ChangelogEntry, ChangelogKind } from '@/lib/changelog'

import { useState } from 'react'
import { SectionLabel } from '@/components/chrome'
import { allChangelog, formatDate } from '@/lib/changelog'

type Filter = 'all' | ChangelogKind

const TABS: { key: Filter, label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'launch', label: 'Launch' },
  { key: 'feature', label: 'Features' },
  { key: 'fix', label: 'Fixes' },
  { key: 'security', label: 'Security' },
]

/** Entries visible for a filter — shared by the count badges and the list. */
function byKind(kind: Filter): ChangelogEntry[] {
  return kind === 'all' ? allChangelog : allChangelog.filter(e => e.kind === kind)
}

/** Small pill carrying the entry's kind — the dot is the lime primary accent. */
function KindPill({ kind }: { kind: ChangelogKind }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-beige-300 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:border-neutral-800 dark:text-zinc-400">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      {kind}
    </span>
  )
}

export function Changelog() {
  const [filter, setFilter] = useState<Filter>('all')
  const entries = byKind(filter)

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16">
      <SectionLabel>Changelog</SectionLabel>
      <header className="mb-8 max-w-2xl">
        <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
          What shipped
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          New entries are posted here as the platform changes. Honest about what is done, not what is promised.
        </p>
      </header>

      {/* Tabbed filter — variant C carry-forward. Each toggle labels its count so
          an empty kind is visible at a glance (no silent drop). */}
      <div
        role="group"
        aria-label="Filter changelog"
        className="flex flex-wrap gap-2 border-b border-beige-300 pb-3 dark:border-neutral-800"
      >
        {TABS.map(tab => {
          const active = filter === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(tab.key)}
              className={
                active
                  ? 'rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground'
                  : 'rounded-full border border-beige-300 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-zinc-400 dark:border-neutral-800 dark:text-zinc-400 dark:hover:border-neutral-600'
              }
            >
              {tab.label}
              {' '}
              (
              {byKind(tab.key).length}
              )
            </button>
          )
        })}
      </div>

      <ol className="flex flex-col gap-12">
        {entries.map(entry => (
          <li
            key={`${entry.date}-${entry.title}`}
            className="border-t border-beige-300 pt-8 first:border-0 first:pt-0 dark:border-neutral-800"
          >
            <div className="mb-2 flex items-center gap-3">
              <KindPill kind={entry.kind} />
            </div>
            <h2 className="text-2xl font-medium tracking-tight">
              {entry.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {entry.summary}
            </p>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              {entry.author}
              {' '}
              ·
              {' '}
              {formatDate(entry.date)}
            </p>
            <div className="mt-6 flex flex-col gap-5">
              {entry.body.map(section => (
                <div key={section.heading}>
                  <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                    <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                    {section.heading}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {section.text}
                  </p>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
