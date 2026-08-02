import { allChangelog, formatDate } from '@/lib/changelog'

const ACCENT_GRADIENT = 'bg-linear-to-r from-blue-500 via-purple-500 to-pink-400'

function AccentDot({ className = '' }: { className?: string }) {
  return <span className={`inline-block size-1.5 rounded-full ${ACCENT_GRADIENT} ${className}`} />
}

/**
 * /en/changelog — renders entries from the typed data module (reverse-
 * chronological). Footer-linked, not main-nav. Server component; the data
 * module is the single source of truth so the list stays sortable.
 */
export function Changelog() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          <AccentDot />
          Changelog
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          What shipped
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          New entries are posted here as the platform changes. Honest about what is done, not what is promised.
        </p>
      </header>

      <div className="flex flex-col gap-12">
        {allChangelog.map(entry => (
          <article key={`${entry.date}-${entry.title}`} className="border-t border-zinc-800 pt-8 first:border-0 first:pt-0">
            <p className="text-xs text-zinc-600 dark:text-zinc-500">
              {entry.author}
              {' '}
              ·
              {' '}
              {formatDate(entry.date)}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-100">
              {entry.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-400">
              {entry.summary}
            </p>
            <div className="mt-6 flex flex-col gap-5">
              {entry.body.map(section => (
                <div key={section.heading}>
                  <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                    <AccentDot />
                    {section.heading}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {section.text}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
