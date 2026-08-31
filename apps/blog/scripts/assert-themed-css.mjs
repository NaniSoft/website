/*
 * Build-time guard: the static export must actually contain the Nextra theme
 * stylesheet, not just the app's own CSS.
 *
 * Why this exists: apps/docs shipped to production with a ~2KB CSS bundle —
 * only the Satoshi @font-face rules — because `nextra-theme-blog/style.css`
 * was never imported. The site rendered as unstyled HTML on every visit and
 * nothing in CI caught it (`next build` exits 0 either way). This script runs
 * after `build` / `cloudflare-build` and fails the build when the exported
 * CSS doesn't carry the theme's rules.
 *
 * Markers are stable strings from nextra-theme-blog@4.6.1's compiled
 * `dist/style.css` (pinned dependency, bundled wholesale by the import): the
 * `@theme` block's primary scale and the `.nextra-code` structural class.
 * The byte floor is far below the real bundle (~72KB) and far above the
 * font-face-only regression (~2KB).
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const cssDir = path.resolve('out/_next/static/css')
const MIN_TOTAL_BYTES = 20 * 1024
const REQUIRED_MARKERS = ['--x-color-primary-', '.nextra-code']

let files
try {
  files = (await readdir(cssDir)).filter((f) => f.endsWith('.css'))
} catch {
  console.error(
    `[assert-themed-css] No CSS directory at ${cssDir} — run this after \`next build\`.`,
  )
  process.exit(1)
}

if (files.length === 0) {
  console.error('[assert-themed-css] No .css files exported — theme CSS is missing.')
  process.exit(1)
}

let total = 0
let combined = ''
for (const file of files) {
  const content = await readFile(path.join(cssDir, file), 'utf8')
  total += content.length
  combined += content
}

const missing = REQUIRED_MARKERS.filter((m) => !combined.includes(m))
console.log(
  `[assert-themed-css] ${files.length} css file(s), ${(total / 1024).toFixed(1)}KB total.`,
)

if (total < MIN_TOTAL_BYTES || missing.length > 0) {
  console.error(
    `[assert-themed-css] FAIL — exported CSS does not contain the nextra-theme-blog stylesheet.\n` +
      `  total bytes: ${total} (floor ${MIN_TOTAL_BYTES})\n` +
      `  missing markers: ${missing.join(', ') || 'none'}\n` +
      `  Likely cause: \`import 'nextra-theme-blog/style.css'\` removed from app/layout.tsx.`,
  )
  process.exit(1)
}

console.log('[assert-themed-css] OK — theme stylesheet present in export.')
