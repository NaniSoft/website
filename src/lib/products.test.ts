import type { Product, ProductCategory } from './products'

import { describe, expect, it } from 'vitest'
import {
  categorySlug,
  flagshipProducts,
  megaMenuGroups,

  productAnchor,
  productCategories,

  productSlug,
  totalProductCount,
} from './products'

// External-behavior tests at the src/lib seam: contracts and ordering, never
// markup. The products data module is the single source for the homepage grid
// (ticket 17), the /en/products page, the navbar mega-menu (ticket 15), and the
// footer flagship links (ticket 16) — so its shape and derivations are pinned
// here.

describe('products data module', () => {
  it('contains exactly 21 products across exactly 5 categories', () => {
    expect(productCategories).toHaveLength(5)
    expect(totalProductCount()).toBe(21)
  })

  it('uses the five agreed category names in order', () => {
    expect(productCategories.map(c => c.name)).toEqual([
      'Core',
      'Ingestion',
      'Query & Traversal',
      'Interfaces',
      'Platform & Trust',
    ])
  })

  it('every product has a non-empty name and one-line description', () => {
    for (const cat of productCategories) {
      for (const p of cat.products) {
        expect(p.name, `${cat.name} > ${p.name}`).toMatch(/.+/)
        expect(p.line, `${cat.name} > ${p.name}`).toMatch(/.+/)
      }
    }
  })

  it('every product slug is unique (anchors never collide)', () => {
    const slugs = productCategories.flatMap(c => c.products.map(p => productSlug(p)))
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})

describe('product anchors', () => {
  it('derives a stable lowercase slug with no spaces per product', () => {
    const atlas: Product = { name: 'Atlas', line: 'x' }
    expect(productSlug(atlas)).toBe('atlas')
    expect(productAnchor(atlas)).toBe('/en/products#atlas')
  })

  it('resolves a /en/products#<slug> anchor for every product', () => {
    for (const cat of productCategories) {
      for (const p of cat.products) {
        expect(productAnchor(p)).toMatch(/^\/en\/products#[a-z0-9-]+$/)
        expect(productAnchor(p)).toBe(`/en/products#${productSlug(p)}`)
      }
    }
  })
})

describe('category anchors', () => {
  it('derives a stable slug per category', () => {
    const core: ProductCategory = { id: 'core', name: 'Core', products: [] }
    expect(categorySlug(core)).toBe('core')
  })

  it('slugifies names with ampersands and spaces', () => {
    const qt: ProductCategory = { id: 'q', name: 'Query & Traversal', products: [] }
    expect(categorySlug(qt)).toBe('query-traversal')
  })
})

describe('mega-menu grouping', () => {
  it('matches the grid grouping: same categories, same products, same anchors', () => {
    expect(megaMenuGroups).toHaveLength(productCategories.length)
    for (const [i, group] of megaMenuGroups.entries()) {
      const cat = productCategories[i]!
      expect(group.name).toBe(cat.name)
      expect(group.anchor).toBe(`/en/products#${categorySlug(cat)}`)
      expect(group.products.map(p => p.name)).toEqual(cat.products.map(p => p.name))
      expect(group.products.map(p => p.anchor)).toEqual(
        cat.products.map(p => productAnchor(p)),
      )
    }
  })
})

describe('flagship products (footer)', () => {
  it('lists the six flagship products by name', () => {
    expect(flagshipProducts.map(p => p.name)).toEqual([
      'Atlas',
      'Bedrock',
      'Keystone',
      'Compass',
      'Sentinel',
      'Meridian',
    ])
  })

  it('every flagship resolves a /en/products#<slug> anchor', () => {
    for (const p of flagshipProducts) {
      expect(p.anchor).toBe(productAnchor({ name: p.name, line: '' }))
    }
  })
})
