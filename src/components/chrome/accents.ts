// Category accent token mapping. The 5 nanisoft product categories map to the
// `--color-*` tokens declared in `src/app/[lang]/styles/index.css`. The one
// id-to-token mismatch is `query-traversal` → `qt` (the token is abbreviated
// to keep generated utility names short). Shared by every surface that paints
// a per-category accent — the homepage hero tabs, the Products page, the
// ecosystem groups, blog tags — so the category→token binding lives in one
// place.

/** The 5 product-category ids (mirrors the `id` values in `productCategories`, `src/lib/products.ts`). */
export type CategoryId
  = | 'core'
    | 'ingestion'
    | 'query-traversal'
    | 'interfaces'
    | 'platform-trust'

const ACCENT_TOKEN: Record<CategoryId, string> = {
  core: 'core',
  ingestion: 'ingestion',
  'query-traversal': 'qt',
  interfaces: 'interfaces',
  'platform-trust': 'platform',
}

/** Token suffix for a category id (e.g. `ingestion`, `qt`). */
export function accentToken(categoryId: CategoryId): string {
  return ACCENT_TOKEN[categoryId]
}

/** CSS var for a category's brand shade, e.g. `var(--color-ingestion)`. */
export function accentVar(categoryId: CategoryId): string {
  return `var(--color-${accentToken(categoryId)})`
}

/** CSS var for a category's band-foreground, e.g. `var(--color-ingestion-foreground)`. */
export function accentForegroundVar(categoryId: CategoryId): string {
  return `var(--color-${accentToken(categoryId)}-foreground)`
}

// Static `bg-*` class names per accent token. The literals are hoisted to module
// scope so Tailwind 4's content scanner sees them and generates the utilities.
const DOT_CLASS: Record<string, string> = {
  core: 'bg-core',
  ingestion: 'bg-ingestion',
  qt: 'bg-qt',
  interfaces: 'bg-interfaces',
  platform: 'bg-platform',
}

/** Static Tailwind `bg-*` class for a category dot/fill, e.g. `bg-ingestion`. */
export function accentDotClass(categoryId: CategoryId): string {
  return DOT_CLASS[accentToken(categoryId)]
}
