// The Nanisoft product suite — single typed data module that drives the
// /en/products page, the homepage products grid (ticket 17), the navbar
// mega-menu (ticket 15), and the footer flagship links (ticket 16). One source
// so every surface stays in sync.
//
// 21 products across 5 categories. No product logos. One-line descriptions,
// business-focused (what it does, not how it's built).

export interface Product {
  name: string
  /** One-line description — what it does and why it matters. */
  line: string
}

export interface ProductCategory {
  /** Stable id (equals the slugified name). */
  id: string
  name: string
  products: Product[]
}

/** A product or category reference for the mega-menu / footer (name + anchor). */
export interface ProductLink {
  name: string
  anchor: string
}

export interface MegaMenuGroup {
  /** Stable category id (equals the category slug). */
  id: string
  name: string
  anchor: string
  products: ProductLink[]
}

/** Lowercase, hyphen-separated slug with no spaces or punctuation. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Stable per-product slug (used as the `/en/products#<slug>` anchor). */
export function productSlug(product: Product): string {
  return slugify(product.name)
}

/** Stable per-category slug (used as the `/en/products#<slug>` anchor). */
export function categorySlug(category: Pick<ProductCategory, 'name'>): string {
  return slugify(category.name)
}

/** Full `/en/products#<slug>` anchor for a product. */
export function productAnchor(product: Product): string {
  return `/en/products#${productSlug(product)}`
}

/** Full `/en/products#<slug>` anchor for a category. */
export function categoryAnchor(category: Pick<ProductCategory, 'name'>): string {
  return `/en/products#${categorySlug(category)}`
}

export const productCategories: ProductCategory[] = [
  {
    id: 'core',
    name: 'Core',
    products: [
      { name: 'Atlas', line: 'Maps every path into your systems and keeps the map current.' },
      { name: 'Bedrock', line: 'The inventory and identity substrate everything else reads from.' },
      { name: 'Keystone', line: 'Policy and access decisions, evaluated against the live graph.' },
      { name: 'Foundation', line: 'Bootstrap and tenant configuration for the rest of the suite.' },
    ],
  },
  {
    id: 'ingestion',
    name: 'Ingestion',
    products: [
      { name: 'Ingress', line: 'Connects cloud, on-prem, and edge sources into one feed.' },
      { name: 'Collector', line: 'Agents that stream state changes without polling.' },
      { name: 'Funnel', line: 'Normalizes inbound data into the canonical graph model.' },
      { name: 'StreamTap', line: 'Tap points for observing ingestion without slowing it.' },
    ],
  },
  {
    id: 'query-traversal',
    name: 'Query & Traversal',
    products: [
      { name: 'Pathfinder', line: 'Finds reachable paths between any two points in the graph.' },
      { name: 'Waypoint', line: 'Caches hot traversals so repeat queries stay sub-second.' },
      { name: 'Traversa', line: 'Batch traversal engine for whole-graph sweeps.' },
      { name: 'Reach', line: 'Blast-radius computation for a given starting point.' },
    ],
  },
  {
    id: 'interfaces',
    name: 'Interfaces',
    products: [
      { name: 'Aperture', line: 'The console teams use to read and query the graph.' },
      { name: 'Portico', line: 'A typed API surface over the platform for automation.' },
      { name: 'Console', line: 'Operator dashboard for health, drift, and alerts.' },
      { name: 'Mirra', line: 'Read-only mirrors for stakeholders who only need to look.' },
    ],
  },
  {
    id: 'platform-trust',
    name: 'Platform & Trust',
    products: [
      { name: 'Compass', line: 'Direction and roadmap view across the whole estate.' },
      { name: 'Sentinel', line: 'Continuous monitoring for the paths that matter most.' },
      { name: 'Meridian', line: 'Audit lineage and proof for every decision the platform made.' },
      { name: 'Bastion', line: 'Hardened boundary controls around privileged traversal.' },
      { name: 'Aegis', line: 'Trust scoring and verification for inbound assertions.' },
    ],
  },
]

/** Total number of products across all categories. */
export function totalProductCount(): number {
  return productCategories.reduce((sum, c) => sum + c.products.length, 0)
}

/** All products flattened (for lookups). */
export const allProducts: Product[] = productCategories.flatMap(c => c.products)

function findProduct(name: string): Product {
  const found = allProducts.find(p => p.name === name)
  if (!found) {
    throw new Error(`Unknown product: ${name}`)
  }
  return found
}

/**
 * Mega-menu grouping — derived from the same data as the grid so the navbar
 * mega-menu (ticket 15) and the /en/products grid never diverge.
 */
export const megaMenuGroups: MegaMenuGroup[] = productCategories.map(cat => ({
  id: cat.id,
  name: cat.name,
  anchor: categoryAnchor(cat),
  products: cat.products.map(p => ({ name: p.name, anchor: productAnchor(p) })),
}))

/**
 * The six flagship products surfaced in the footer (ticket 16): the Core trio
 * plus three Platform & Trust anchors. Derived from the suite so the footer
 * links resolve to real anchors.
 */
export const flagshipProducts: ProductLink[] = [
  'Atlas',
  'Bedrock',
  'Keystone',
  'Compass',
  'Sentinel',
  'Meridian',
].map(name => ({ name, anchor: productAnchor(findProduct(name)) }))
