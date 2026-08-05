import type { CategoryId } from '@/components/chrome'

import { describe, expect, it } from 'vitest'

import { productAnchor, productCategories } from '@/lib/products'

import {
  categoryHeroes,
  gatewayCategory,
  TRUST_INDUSTRIES,
} from './home-content'

// External-behavior tests at the data-module seam: the homepage hero category
// copy and the trust-band industry list, joined to `src/lib/products.ts` so the
// hero tabs and the `/en/products` page never diverge. Contracts and shape —
// never markup. The hero presentation (tabs, cross-fade, gateway tile) is
// covered by e2e, not here.

describe('homepage hero content', () => {
  it('has one hero entry per product category, in category order', () => {
    expect(categoryHeroes).toHaveLength(productCategories.length)
    expect(categoryHeroes.map(c => c.id)).toEqual(
      productCategories.map(c => c.id),
    )
    expect(categoryHeroes.map(c => c.name)).toEqual(
      productCategories.map(c => c.name),
    )
  })

  it('every category hero has non-empty heading, description, and cta', () => {
    for (const hero of categoryHeroes) {
      expect(hero.heading.trim()).not.toBe('')
      expect(hero.description.trim()).not.toBe('')
      expect(hero.cta.trim()).not.toBe('')
    }
  })

  it('every entry carries the per-product anchors from the products module', () => {
    for (const hero of categoryHeroes) {
      const category = productCategories.find(c => c.id === hero.id)!
      expect(hero.products.map(p => p.name)).toEqual(
        category.products.map(p => p.name),
      )
      for (const [i, product] of category.products.entries()) {
        expect(hero.products[i].anchor).toBe(productAnchor(product))
      }
    }
  })

  it('pins exactly one gateway category — Query & Traversal — with a secondary CTA', () => {
    const gateways = categoryHeroes.filter(c => c.gateway)
    expect(gateways).toHaveLength(1)
    expect(gateways[0].id).toBe('query-traversal')
    expect(gateways[0].secondaryCta?.trim()).not.toBe('')
  })

  it('non-gateway categories have no secondary CTA', () => {
    for (const hero of categoryHeroes) {
      if (!hero.gateway) {
        expect(hero.secondaryCta).toBeUndefined()
      }
    }
  })

  it('exposes the gateway category directly as the flagship entry point', () => {
    expect(gatewayCategory.id).toBe('query-traversal')
    expect(gatewayCategory.gateway).toBe(true)
  })

  it('every hero id is a known category accent id', () => {
    const known: CategoryId[] = [
      'core',
      'ingestion',
      'query-traversal',
      'interfaces',
      'platform-trust',
    ]
    for (const hero of categoryHeroes) {
      expect(known).toContain(hero.id)
    }
  })
})

describe('homepage trust band', () => {
  it('lists ten non-empty industry segments', () => {
    expect(TRUST_INDUSTRIES).toHaveLength(10)
    for (const industry of TRUST_INDUSTRIES) {
      expect(industry.trim()).not.toBe('')
    }
  })

  it('has no duplicate industries', () => {
    const values = TRUST_INDUSTRIES.map(i => i.trim())
    expect(new Set(values).size).toBe(values.length)
  })
})
