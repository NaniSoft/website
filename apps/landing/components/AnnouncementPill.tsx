import { ANNOUNCEMENT } from '@/lib/data';

/**
 * The hero's announcement pill — a surveyor's plate above the eyebrow: a
 * petrol-mid chip on the forced-dark panel, 1px hairline, mono annotation,
 * teal supporting dot. It links out to the latest real field note on the blog
 * (ANNOUNCEMENT in lib/data) and is the hero's ONLY editorial object — the
 * product ask stays at the close (SPEC §Don't).
 *
 * The dot is `--color-secondary-on-dark` (survey teal): "recently published"
 * is information, not a live state, so jade would be a lie (One Pulse Rule).
 * The arrow is drawn — this system renders its marks, it doesn't borrow
 * glyphs. Server Component; the link needs no client JS.
 */
export function AnnouncementPill() {
  return (
    <a
      className="announcement-pill"
      href={ANNOUNCEMENT.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="announcement-dot" aria-hidden />
      <span className="announcement-text mono">
        <span className="announcement-tag">{ANNOUNCEMENT.tag}</span>
        {ANNOUNCEMENT.label}
      </span>
      <svg className="announcement-arrow" aria-hidden width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 9.5 9.5 2.5M4.25 2.5H9.5V7.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
