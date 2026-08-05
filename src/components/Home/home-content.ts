// Homepage hero + trust-band content. Joins the 5 product categories from
// `src/lib/products.ts` to the per-category hero copy (heading, description,
// CTA) so the hero tabs and the `/en/products` page stay in sync. The Query &
// Traversal category is the gateway slot — a dark `--color-qt-dark` tile with a
// primary plus a secondary CTA — so the flagship entry point stands out.
//
// Single source for the homepage hero tabs (ticket impl/03), the trust band,
// and the ecosystem section's per-category heading. The hero *presentation*
// (tabs, cross-fade, gateway tile) lives in `Hero.tsx`; this module is the data
// it renders.

import type { CategoryId } from '@/components/chrome'

import { productAnchor, productCategories } from '@/lib/products'

export interface CategoryHeroProduct {
  name: string
  /** `/en/products#<slug>` anchor for the product. */
  anchor: string
}

export interface CategoryHero {
  /** Stable category id (mirrors `productCategories`). */
  id: CategoryId
  name: string
  heading: string
  description: string
  cta: string
  /** Secondary CTA — only the gateway (Query & Traversal) carries one. */
  secondaryCta?: string
  /** Query & Traversal — the dark `--color-qt-dark` gateway tile + 2 CTAs. */
  gateway: boolean
  products: CategoryHeroProduct[]
}

interface CategoryCopy {
  heading: string
  description: string
  cta: string
  secondaryCta?: string
  /** Query & Traversal — the flagship gateway slot. */
  gateway?: boolean
}

const COPY: Record<CategoryId, CategoryCopy> = {
  core: {
    heading: 'Map every path into your systems',
    description:
      'Core builds the live attack-path graph — inventory, identity, and policy evaluated against it in real time. Four products, one substrate everything else reads from.',
    cta: 'Explore Core',
  },
  ingestion: {
    heading: 'Every source, one stream',
    description:
      'Ingestion connects cloud, on-prem, and edge sources into a single normalized feed, so the graph stays current without polling.',
    cta: 'Explore Ingestion',
  },
  'query-traversal': {
    heading: 'Traverse the graph in milliseconds',
    description:
      'Query & Traversal finds reachable paths between any two points, caches hot traversals, and computes blast radius across your whole estate.',
    cta: 'Explore Pathfinder',
    secondaryCta: 'View all products',
    gateway: true,
  },
  interfaces: {
    heading: 'Every way in, one console',
    description:
      'Interfaces give teams a console, a typed API, and read-only mirrors over the same live graph — built for operators and automators alike.',
    cta: 'Explore Interfaces',
  },
  'platform-trust': {
    heading: 'Direction, monitoring, and proof',
    description:
      'Platform & Trust keeps the estate directed, monitored, auditable, and hardened end to end — the layer that runs the whole suite.',
    cta: 'Explore Platform & Trust',
  },
}

function toHero(category: (typeof productCategories)[number]): CategoryHero {
  const copy = COPY[category.id as CategoryId]
  return {
    id: category.id as CategoryId,
    name: category.name,
    heading: copy.heading,
    description: copy.description,
    cta: copy.cta,
    secondaryCta: copy.secondaryCta,
    gateway: Boolean(copy.gateway),
    products: category.products.map(product => ({
      name: product.name,
      anchor: productAnchor(product),
    })),
  }
}

/** The 5 category hero entries, in product-category order. */
export const categoryHeroes: CategoryHero[] = productCategories.map(toHero)

/** The gateway category pinned as the flagship hero slot (Query & Traversal). */
export const gatewayCategory: CategoryHero = categoryHeroes.find(
  hero => hero.gateway,
)!

/** Trust-band industry segments — the honest "trusted by" (named, not logos). */
export const TRUST_INDUSTRIES = [
  'Financial Services',
  'Healthcare',
  'Critical Infrastructure',
  'Government',
  'Retail',
  'Energy',
  'Telecom',
  'Cloud Platforms',
  'Logistics',
  'Manufacturing',
] as const
