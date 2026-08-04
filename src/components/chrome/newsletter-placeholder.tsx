import { SectionLabel } from './section-label'

type NewsletterLayout = 'inline-card' | 'accordion' | 'full-band'

interface NewsletterPlaceholderProps {
  /** Card / accordion / full-width band. Defaults to `inline-card`. */
  layout?: NewsletterLayout
  /** Override the section label text; defaults to "Newsletter". */
  label?: string
}

/**
 * A no-op newsletter affordance — a visible email form with no submit wired,
 * for layout review. Three layouts:
 *  - `inline-card`  — bordered card with a `SectionLabel` + form.
 *  - `accordion`    — a `<details>` that expands to the form.
 *  - `full-band`    — a full-width bright-lime band with the form.
 *
 * The CTA button uses the mode-tuned lime primary; the full-band decoration
 * uses the static hive-yellow so it reads bright in both modes.
 */
export function NewsletterPlaceholder({
  layout = 'inline-card',
  label = 'Newsletter',
}: NewsletterPlaceholderProps) {
  if (layout === 'accordion') {
    return (
      <details className="rounded-2xl border border-beige-300 p-5 dark:border-neutral-800">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-base font-medium [&::-webkit-details-marker]:hidden">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden />
          {label}
          <span className="ml-auto text-xs text-muted-foreground">Subscribe</span>
          <span aria-hidden className="text-muted-foreground transition-transform [[open]>&]:rotate-180">▾</span>
        </summary>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            One email a month: what shipped, what we learned, what changed in the graph.
          </p>
          <EmailForm className="mt-3" />
          <p className="mt-2 text-[11px] text-muted-foreground">No-op — placeholder for layout review.</p>
        </div>
      </details>
    )
  }

  if (layout === 'full-band') {
    return (
      <div className="bg-hive-yellow px-6 py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-dark/70">
              {label}
            </div>
            <h3 className="text-2xl font-medium tracking-tight text-dark md:text-3xl">
              Notes from Nanisoft, monthly.
            </h3>
            <p className="mt-2 max-w-md text-sm text-dark/80">
              One email a month: what shipped, what we learned, what changed in the graph.
            </p>
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={e => e.preventDefault()}
            data-newsletter-form
          >
            <input
              type="email"
              placeholder="you@company.com"
              aria-label="Email address"
              className="flex-1 rounded-md border border-dark/20 bg-white px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              disabled
              className="cursor-not-allowed rounded-md bg-dark px-5 py-3 text-sm font-medium text-white"
              title="Placeholder — no submit wired"
            >
              Subscribe →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // inline-card
  return (
    <div className="rounded-2xl border border-beige-300 p-6 dark:border-neutral-800">
      <SectionLabel>{label}</SectionLabel>
      <h3 className="text-xl font-medium tracking-tight">Notes from Nanisoft, monthly.</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        One email a month: what shipped, what we learned, what changed in the graph.
      </p>
      <EmailForm className="mt-4" />
      <p className="mt-2 text-[11px] text-muted-foreground">No-op — placeholder for layout review.</p>
    </div>
  )
}

/** Shared email + subscribe form for the inline-card and accordion layouts. */
function EmailForm({ className = '' }: { className?: string }) {
  return (
    <form
      className={`flex flex-col gap-2 sm:flex-row ${className}`}
      onSubmit={e => e.preventDefault()}
      data-newsletter-form
    >
      <input
        type="email"
        placeholder="you@company.com"
        aria-label="Email address"
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <button
        type="submit"
        disabled
        className="cursor-not-allowed rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        title="Placeholder — no submit wired"
      >
        Subscribe
      </button>
    </form>
  )
}
