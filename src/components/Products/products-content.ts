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

import type { Product } from '@/lib/products'
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
  /** Primary CTA. */
  primaryCta: ProductCta
  /** Optional secondary CTA (gateway products only — Pathfinder, Aperture). */
  secondaryCta?: ProductCta
}

// Per-product feature checkmarks. Sourced from the product one-liners in
// `src/lib/products.ts`, expanded with concrete capability copy. Stub copy —
// the lines are business-focused (what it does, not how it is built).
const FEATURES: Record<string, readonly string[]> = {
  Atlas: [
    'Continuously discovers assets and identities across cloud and on-prem',
    'Reconstructs the live attack-path graph from real telemetry',
    'Highlights reachable paths the moment they appear',
  ],
  Bedrock: [
    'Unified inventory across accounts, regions, and identity providers',
    'Identity-aware entity model with policy resolution at the edge',
    'Single source of truth every other product reads from',
  ],
  Keystone: [
    'Policy decisions evaluated against the live graph',
    'Prevents drift between declared intent and what is enforced',
    'Auditable decision lineage for every allow / deny',
  ],
  Foundation: [
    'Tenant bootstrap and environment configuration',
    'Identity and access scaffolding for the rest of the suite',
    'Single deployable unit — every product depends on it',
  ],
  Ingress: [
    'Connectors for cloud, on-prem, and edge sources',
    'Push-based ingest with replay-safe delivery',
    'Backpressure-aware without dropping events',
  ],
  Collector: [
    'Lightweight agents that stream state changes',
    'No polling, no scheduled sweeps',
    'Cross-platform — Linux, macOS, Windows, containers',
  ],
  Funnel: [
    'Normalizes heterogeneous data into the canonical graph model',
    'Schema-aware validation with repair hints',
    'Stream-and-batch hybrid for late-arriving facts',
  ],
  StreamTap: [
    'Observe ingestion in flight without slowing it',
    'Read-only mirror for debugging and audits',
    'Captures raw payloads for incident reconstruction',
  ],
  Pathfinder: [
    'Finds reachable paths between any two points in the graph',
    'Sub-second traversal on graphs with millions of edges',
    'Permission-aware — only returns paths the actor could take',
  ],
  Waypoint: [
    'Caches hot traversals so repeat queries stay sub-second',
    'Adaptive eviction driven by query frequency',
    'Transparent — callers do not have to opt in',
  ],
  Traversa: [
    'Batch traversal engine for whole-graph sweeps',
    'Parallelism-tuned for the hardware you run it on',
    'Streamed results — no full-materialize step',
  ],
  Reach: [
    'Blast-radius computation for a given starting point',
    'Bounded traversal depth with explicit assumptions',
    'Answers "what could an attacker touch from here?"',
  ],
  Aperture: [
    'Console for operators to read and query the graph',
    'Saved views and shareable query links',
    'Live, not snapshot — every click reflects current state',
  ],
  Portico: [
    'Typed API surface over the platform for automation',
    'Stable contracts with explicit versioning',
    'First-class SDKs for the languages teams actually use',
  ],
  Console: [
    'Operator dashboard for health, drift, and alerts',
    'Topology view that stays current with the graph',
    'Acknowledged-state workflow for on-call rotations',
  ],
  Mirra: [
    'Read-only mirrors for stakeholders who only need to look',
    'Scoped views — finance sees its slice, security sees everything',
    'No write paths, no accidental mutations',
  ],
  Compass: [
    'Direction and roadmap view across the whole estate',
    'Coverage and posture scorecards per business unit',
    'Drives the executive narrative — what is improving, what is regressing',
  ],
  Sentinel: [
    'Continuous monitoring for the paths that matter most',
    'Alerts that respect graph state, not just events',
    'Tuned for low signal-to-noise — no pager fatigue',
  ],
  Meridian: [
    'Audit lineage and proof for every platform decision',
    'Tamper-evident trail across the full suite',
    'Exportable for compliance and post-incident review',
  ],
  Bastion: [
    'Hardened boundary controls around privileged traversal',
    'Breakglass workflow with full audit capture',
    'Defense in depth — assumes the rest of the suite is compromised',
  ],
  Aegis: [
    'Trust scoring and verification for inbound assertions',
    'Continuous validation, not point-in-time checks',
    'Plays well with existing identity providers',
  ],
}

// Every product's primary CTA routes to the contact section for now — there is
// no real trial / console / docs-page-for-each-product yet. Gateway products
// (Pathfinder, Aperture) carry a secondary CTA with a real destination.
const CONTACT_HREF = '/en#get-in-touch'

/** Per-access-model CTA shape, decision-rich and prototype-derived. */
function ctaFor(product: Product, categoryId: CategoryId): {
  primaryCta: ProductCta
  secondaryCta?: ProductCta
} {
  if (product.name === 'Pathfinder') {
    return {
      primaryCta: { label: 'Try Pathfinder', href: CONTACT_HREF },
      secondaryCta: { label: 'View all products', href: '/en/products' },
    }
  }
  if (product.name === 'Aperture') {
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
    return category.products.map((product) => {
      const cta = ctaFor(product, categoryId)
      return {
        name: product.name,
        line: product.line,
        category: category.name,
        categoryId,
        slug: productSlug(product),
        features: FEATURES[product.name] ?? [],
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
