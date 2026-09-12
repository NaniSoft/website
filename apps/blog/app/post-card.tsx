import Link from 'next/link'
import { formatIsoDate } from '../lib/date'
import type { Post } from '@/lib/posts'

/**
 * The brand post card — replaces `PostCard` from nextra-theme-blog for two
 * reasons the theme's component cannot express:
 *
 *   1. the card surface. The theme's PostCard renders a bare `<div>` (title,
 *      excerpt, date, nothing else), so the list read as loose text. The
 *      surface itself is owned by the `<li class="post-card">` in post-list —
 *      elevated background, 1px hairline, 20px card radius, 24px padding.
 *   2. the date. The theme renders `new Date(date).toDateString()`
 *      ("Fri Aug 27 2026"); the blog's one date format is ISO, from
 *      `formatIsoDate`, set in the mono data face.
 *
 * Structure is otherwise the theme's: title link, description + "Read More →",
 * date. Styling lives in globals.css (.post-card-*, plus the `time` rule).
 */
export default function PostCard({ post }: { post: Post }) {
  const iso = formatIsoDate(post.date)
  return (
    <>
      <h2 className="post-card-title">
        <Link href={post.route}>{post.title}</Link>
      </h2>
      {post.description && (
        <p className="post-card-excerpt">
          {post.description}
          <Link href={post.route} className="post-card-more">
            Read More →
          </Link>
        </p>
      )}
      {iso && (
        <time className="post-card-date" dateTime={iso}>
          {iso}
        </time>
      )}
    </>
  )
}
