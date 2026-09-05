import Link from 'next/link'

/**
 * The blog's 404, in the Living Map grammar: the coordinate (404) in the mono
 * data face inside the display heading, the factual verdict, and one recovery
 * ask as the interactive-base pill. Styling lives in globals.css (.nf-*).
 */
export default function NotFound() {
  return (
    <div className="nf">
      <h1>
        <span className="nf-code">404</span> — page not found
      </h1>
      <p className="nf-copy">This page does not exist in the nanisoft blog.</p>
      <p className="nf-links">
        <Link href="/" className="nf-button">
          Back to the blog
        </Link>{' '}
        <a href="https://nanisoft.com" className="nf-alt">
          nanisoft.com
        </a>
      </p>
    </div>
  )
}
