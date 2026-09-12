/**
 * The blog's one date format: ISO `YYYY-MM-DD`, rendered in JetBrains Mono
 * (the data face) everywhere a date appears — the post-card stamp and the
 * article byline alike. Dates are data, and locale-dependent renderings
 * (`27/8/2026`, `Fri Aug 27 2026`) are three systems pretending to be one.
 *
 * `toISOString()` is UTC; a bare `YYYY-MM-DD` frontmatter date parses as UTC
 * midnight, so the calendar day survives the round-trip unchanged.
 */
export function formatIsoDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}
