import { formatDate } from '@/lib/blog'

/**
 * Blog post header — renders the description as a lead and a muted author +
 * date line. Imported by each post MDX so every post page presents title /
 * description / date / author consistently. (The title itself comes from the
 * MDX frontmatter, rendered as the H1 by Nextra.)
 */
export function PostMeta({
  date,
  author,
  description,
}: {
  date: string
  author: string
  description: string
}) {
  return (
    <>
      <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-500">
        {author}
        {' '}
        ·
        {' '}
        {formatDate(date)}
      </p>
      <p className="mb-8 border-l-2 border-zinc-700 pl-4 text-lg leading-relaxed text-zinc-400">
        {description}
      </p>
    </>
  )
}
