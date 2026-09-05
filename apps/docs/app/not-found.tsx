import Link from 'next/link'

/**
 * The docs' 404, in the Living Map grammar: the coordinate (404) in the mono
 * data face inside the display heading, the factual verdict, and one recovery
 * ask as the interactive-base pill. Styling lives in globals.css (.nf-*).
 * Mirrors apps/blog/app/not-found.tsx.
 */
export default function NotFound() {
  return (
    <div className="nf">
      <h1>
        <span className="nf-code">404</span> — page not found
      </h1>
      <p className="nf-copy">This page does not exist in the nanisoft docs.</p>
      <p className="nf-links">
        <Link href="/" className="nf-button">
          Back to the docs
        </Link>{' '}
        <a href="https://nanisoft.com" className="nf-alt">
          nanisoft.com
        </a>
      </p>
    </div>
  )
}
