import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ padding: '96px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1>404 — page not found</h1>
      <p>This page does not exist in the nanisoft blog.</p>
      <p>
        <Link href="/">Back to the blog</Link> ·{' '}
        <a href="https://nanisoft.com">nanisoft.com</a>
      </p>
    </div>
  )
}
