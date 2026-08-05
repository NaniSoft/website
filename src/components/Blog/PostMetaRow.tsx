import { formatDate } from '@/lib/blog'

interface PostMetaRowProps {
  author: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  readingMinutes: number
}

/**
 * The shared author · date · reading-time meta row for a blog card. Extracted
 * from the editorial index (featured card + stacked items) so the shape lives in
 * one place. The post page (`PostLayout`) keeps its own inline meta row — it
 * drops the date (shown in its `SectionLabel`) and folds the `TagList` in, so it
 * is a different shape, not a duplicate.
 */
export function PostMetaRow({ author, date, readingMinutes }: PostMetaRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
      <span>{author}</span>
      <span aria-hidden>·</span>
      <span>{formatDate(date)}</span>
      <span aria-hidden>·</span>
      <span>
        {readingMinutes}
        {' '}
        min read
      </span>
    </div>
  )
}
