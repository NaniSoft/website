import Link from 'next/link'

import { allBlogs, formatDate, postUrl } from '@/lib/blog'

const ACCENT_GRADIENT = 'bg-linear-to-r from-blue-500 via-purple-500 to-pink-400'

function AccentDot({ className = '' }: { className?: string }) {
  return <span className={`inline-block size-1.5 rounded-full ${ACCENT_GRADIENT} ${className}`} />
}

/**
 * /en/blog index — lists every post reverse-chronologically (the data module
 * is already sorted). Server component; one source of truth. Each card links
 * to the post page and shows title, description, date, and author.
 */
export function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          <AccentDot />
          Blog
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-4xl">
          Notes from Nanisoft
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Thinking on security graphs, the suite, and the gaps left by enterprise tools.
        </p>
      </header>

      <ul className="flex flex-col divide-y divide-zinc-800">
        {allBlogs.map(post => (
          <li key={post.slug} className="py-6">
            <Link href={postUrl(post)} className="group block">
              <h2 className="text-xl font-semibold text-zinc-100 group-hover:text-white">
                {post.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {post.description}
              </p>
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-500">
                {post.author}
                {' '}
                ·
                {' '}
                {formatDate(post.date)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
