import type { PostTag } from '@/lib/blog-chrome'
import { accentDotClass } from './accents'

interface TagListProps {
  /** Tags for a post (accent-dot pills). */
  tags: PostTag[]
}

/** A single tag pill — a small accent dot plus an ink label. */
function TagPill({ tag }: { tag: PostTag }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-beige-300 bg-background px-2.5 py-0.5 text-xs text-foreground dark:border-neutral-800">
      <span
        className={`size-1.5 rounded-full ${accentDotClass(tag.category)}`}
        data-accent={tag.category}
        aria-hidden
      />
      {tag.label}
    </span>
  )
}

/**
 * A blog post's tag list — a wrapping row of accent-dot pills. The dot carries
 * the category accent (the design rule: the dot is the accent, the label stays
 * ink — no inline small accent text on the shared background). Each pill
 * inherits the global `.hive-focus` ring. Renders nothing when there are no
 * tags.
 */
export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) {
    return null
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map(tag => (
        <li key={tag.label}>
          <TagPill tag={tag} />
        </li>
      ))}
    </ul>
  )
}
