// The per-product landing copy for the `/en/products` page — joins the 21
// products from `src/lib/products.ts` to the per-product feature checkmarks and
// the per-access-model CTA pair, so one `ProductPageTemplate` renders every
// section. Single source for the Products page detail sections; the page index
// (category grid) lives in `index.tsx`, the uniform template in
// `ProductPageTemplate.tsx`.
//
// Accent colour comes from the `--color-*` tokens via `chrome/accents` (by
// `categoryId`) — never a hardcoded hex, never the upstream vendor's brand
// string. The data module is pure (no Nextra/Next runtime) so it is testable
// at the seam.

import type { CategoryId } from '@/components/chrome'

import { productCategories, productSlug } from '@/lib/products'

/** A labelled call-to-action with an honest destination. */
export interface ProductCta {
  label: string
  /** Where the CTA goes. Real destinations only — no dead `#`. */
  href: string
}

export interface ProductLanding {
  name: string
  /** One-line description (same as `Product.line`). */
  line: string
  /** Category display name (used for the breadcrumb eyebrow + group label). */
  category: string
  /** Stable category id — drives the accent token via `chrome/accents`. */
  categoryId: CategoryId
  /** Stable per-product slug (the `#<slug>` + `#<slug>-detail` anchor stem). */
  slug: string
  /** Three to five feature checkmarks the template renders. */
  features: readonly string[]
  /** How many products share this category (for the side-rail count). */
  categoryProductCount: number
  /** Primary CTA. */
  primaryCta: ProductCta
  /** Optional secondary CTA (gateway products only — Pathfinder, Aperture). */
  secondaryCta?: ProductCta
}

// Per-product feature checkmarks, keyed by the stable product slug (not the
// display name) so a rename can never silently drop a product's features.
// Sourced from the product one-liners in `src/lib/products.ts`, expanded with
// concrete capability copy. Stub copy — business-focused (what it does, not
// how it is built).
const FEATURES: Record<string, readonly string[]> = {
  atlas: [
    'Continuously discovers assets and identities across cloud and on-prem',
    'Reconstructs the live attack-path graph from real telemetry',
    'Highlights reachable paths the moment they appear',
  ],
  bedrock: [
    'Unified inventory across accounts, regions, and identity providers',
    'Identity-aware entity model with policy resolution at the edge',
    'Single source of truth every other product reads from',
  ],
  keystone: [
    'Policy decisions evaluated against the live graph',
    'Prevents drift between declared intent and what is enforced',
    'Auditable decision lineage for every allow / deny',
  ],
  foundation: [
    'Tenant bootstrap and environment configuration',
    'Identity and access scaffolding for the rest of the suite',
    'Single deployable unit — every product depends on it',
  ],
  ingress: [
    'Connectors for cloud, on-prem, and edge sources',
    'Push-based ingest with replay-safe delivery',
    'Backpressure-aware without dropping events',
  ],
  collector: [
    'Lightweight agents that stream state changes',
    'No polling, no scheduled sweeps',
    'Cross-platform — Linux, macOS, Windows, containers',
  ],
  funnel: [
    'Normalizes heterogeneous data into the canonical graph model',
    'Schema-aware validation with repair hints',
    'Stream-and-batch hybrid for late-arriving facts',
  ],
  streamtap: [
    'Observe ingestion in flight without slowing it',
    'Read-only mirror for debugging and audits',
    'Captures raw payloads for incident reconstruction',
  ],
  pathfinder: [
    'Finds reachable paths between any two points in the graph',
    'Sub-second traversal on graphs with millions of edges',
    'Permission-aware — only returns paths the actor could take',
  ],
  waypoint: [
    'Caches hot traversals so repeat queries stay sub-second',
    'Adaptive eviction driven by query frequency',
    'Transparent — callers do not have to opt in',
  ],
  traversa: [
    'Batch traversal engine for whole-graph sweeps',
    'Parallelism-tuned for the hardware you run it on',
    'Streamed results — no full-materialize step',
  ],
  reach: [
    'Blast-radius computation for a given starting point',
    'Bounded traversal depth with explicit assumptions',
    'Answers "what could an attacker touch from here?"',
  ],
  aperture: [
    'Console for operators to read and query the graph',
    'Saved views and shareable query links',
    'Live, not snapshot — every click reflects current state',
  ],
  portico: [
    'Typed API surface over the platform for automation',
    'Stable contracts with explicit versioning',
    'First-class SDKs for the languages teams actually use',
  ],
  console: [
    'Operator dashboard for health, drift, and alerts',
    'Topology view that stays current with the graph',
    'Acknowledged-state workflow for on-call rotations',
  ],
  mirra: [
    'Read-only mirrors for stakeholders who only need to look',
    'Scoped views — finance sees its slice, security sees everything',
    'No write paths, no accidental mutations',
  ],
  compass: [
    'Direction and roadmap view across the whole estate',
    'Coverage and posture scorecards per business unit',
    'Drives the executive narrative — what is improving, what is regressing',
  ],
  sentinel: [
    'Continuous monitoring for the paths that matter most',
    'Alerts that respect graph state, not just events',
    'Tuned for low signal-to-noise — no pager fatigue',
  ],
  meridian: [
    'Audit lineage and proof for every platform decision',
    'Tamper-evident trail across the full suite',
    'Exportable for compliance and post-incident review',
  ],
  bastion: [
    'Hardened boundary controls around privileged traversal',
    'Breakglass workflow with full audit capture',
    'Defense in depth — assumes the rest of the suite is compromised',
  ],
  aegis: [
    'Trust scoring and verification for inbound assertions',
    'Continuous validation, not point-in-time checks',
    'Plays well with existing identity providers',
  ],
}

// Every product's primary CTA routes to the contact section for now — there is
// no real trial / console / docs-page-for-each-product yet. Gateway products
// (Pathfinder, Aperture) carry a secondary CTA with a real destination.
const CONTACT_HREF = '/en#get-in-touch'

// The shared follow-on sentence appended to the product line in the body lede.
// Lives here (not inline in the template) so page prose is edited in one place.
export const PRODUCT_BODY_SUFFIX
  = 'It runs against the same live graph every other Nanisoft product reads from, so you do not have to reconcile outputs between point tools.'

/**
 * Per-access-model CTA shape, decision-rich and prototype-derived. Branches on
 *  the stable slug (not the display name) so a rename can't change CTA shape.
 */
function ctaFor(slug: string, categoryId: CategoryId): {
  primaryCta: ProductCta
  secondaryCta?: ProductCta
} {
  if (slug === 'pathfinder') {
    return {
      primaryCta: { label: 'Try Pathfinder', href: CONTACT_HREF },
      secondaryCta: { label: 'View all products', href: '/en/products' },
    }
  }
  if (slug === 'aperture') {
    return {
      primaryCta: { label: 'Open the console', href: CONTACT_HREF },
      secondaryCta: { label: 'Read the docs', href: '/en/docs' },
    }
  }
  if (categoryId === 'platform-trust') {
    return { primaryCta: { label: 'Talk to the team', href: CONTACT_HREF } }
  }
  return { primaryCta: { label: 'Request access', href: CONTACT_HREF } }
}

/** All 21 product landings, in product-category order. */
export const productLandings: ProductLanding[] = productCategories.flatMap(
  (category) => {
    const categoryId = category.id as CategoryId
    const categoryProductCount = category.products.length
    return category.products.map((product) => {
      const slug = productSlug(product)
      const cta = ctaFor(slug, categoryId)
      return {
        name: product.name,
        line: product.line,
        category: category.name,
        categoryId,
        slug,
        features: FEATURES[slug] ?? [],
        categoryProductCount,
        primaryCta: cta.primaryCta,
        secondaryCta: cta.secondaryCta,
      }
    })
  },
)

export interface ProductLandingCategory {
  /** Stable category id (mirrors `productCategories`). */
  id: CategoryId
  name: string
  products: ProductLanding[]
}

/** The 5 categories with their landings, in product-category order. */
export const productLandingsByCategory: ProductLandingCategory[]
  = productCategories.map((category) => {
    const categoryId = category.id as CategoryId
    return {
      id: categoryId,
      name: category.name,
      products: productLandings.filter(landing => landing.categoryId === categoryId),
    }
  })

/** Look up a landing by slug (the `#<slug>` / `#<slug>-detail` stem). */
export function landingBySlug(slug: string): ProductLanding | undefined {
  return productLandings.find(landing => landing.slug === slug)
}
