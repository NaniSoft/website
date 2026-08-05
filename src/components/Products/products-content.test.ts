import { describe, expect, it } from 'vitest'

import { productCategories, productSlug } from '@/lib/products'

import {
  landingBySlug,
  productLandings,
  productLandingsByCategory,
} from './products-content'

// Data-seam tests for the Products page content module. Pins the join between
// `src/lib/products.ts` (identity + anchors) and the per-product landing copy
// (features + CTA shape) so the `/en/products` page and every surface that
// links into it stay in sync. Contracts and shape — never markup. The render
// contract is covered by `ProductPageTemplate.test.tsx`.

describe('product landings', () => {
  it('has one landing per product — 21 across 5 categories', () => {
    expect(productLandings).toHaveLength(
      productCategories.reduce((sum, c) => sum + c.products.length, 0),
    )
    expect(productLandingsByCategory).toHaveLength(productCategories.length)
  })

  it('keeps the category order and ids in sync with src/lib/products', () => {
    expect(productLandingsByCategory.map(c => c.id)).toEqual(
      productCategories.map(c => c.id),
    )
    expect(productLandingsByCategory.map(c => c.name)).toEqual(
      productCategories.map(c => c.name),
    )
  })

  it('every landing carries the product slug, line, and category from the source', () => {
    for (const cat of productCategories) {
      for (const product of cat.products) {
        const landing = landingBySlug(productSlug(product))
        expect(landing, `missing landing for ${product.name}`).toBeDefined()
        expect(landing!.name).toBe(product.name)
        expect(landing!.line).toBe(product.line)
        expect(landing!.category).toBe(cat.name)
        expect(landing!.slug).toBe(productSlug(product))
      }
    }
  })

  it('every product has at least one feature checkmark', () => {
    for (const landing of productLandings) {
      expect(landing.features.length, landing.name).toBeGreaterThan(0)
    }
  })

  it('every primary CTA has a non-empty label and a real /en href (no dead #)', () => {
    for (const landing of productLandings) {
      expect(landing.primaryCta.label.trim()).not.toBe('')
      expect(landing.primaryCta.href).toMatch(/^\/en/)
      expect(landing.primaryCta.href).not.toBe('#')
    }
  })

  it('only Pathfinder and Aperture carry a secondary CTA', () => {
    const withSecondary = productLandings.filter(l => l.secondaryCta)
    expect(withSecondary.map(l => l.name).sort()).toEqual(['Aperture', 'Pathfinder'])
    for (const landing of withSecondary) {
      expect(landing.secondaryCta!.label.trim()).not.toBe('')
      expect(landing.secondaryCta!.href).toMatch(/^\/en/)
    }
  })
})

describe('product CTA shape per access model', () => {
  it('pathfinder — "Try Pathfinder" + "View all products"', () => {
    const landing = landingBySlug('pathfinder')!
    expect(landing.primaryCta.label).toBe('Try Pathfinder')
    expect(landing.secondaryCta?.label).toBe('View all products')
    expect(landing.secondaryCta?.href).toBe('/en/products')
  })

  it('aperture — "Open the console" + "Read the docs"', () => {
    const landing = landingBySlug('aperture')!
    expect(landing.primaryCta.label).toBe('Open the console')
    expect(landing.secondaryCta?.label).toBe('Read the docs')
    expect(landing.secondaryCta?.href).toBe('/en/docs')
  })

  it('platform & Trust products — "Talk to the team", no secondary', () => {
    const platform = productLandingsByCategory.find(c => c.id === 'platform-trust')!
    for (const landing of platform.products) {
      expect(landing.primaryCta.label).toBe('Talk to the team')
      expect(landing.secondaryCta).toBeUndefined()
    }
  })

  it('everyone else — "Request access", no secondary', () => {
    const defaultProducts = productLandings.filter(
      l =>
        l.name !== 'Pathfinder'
        && l.name !== 'Aperture'
        && l.categoryId !== 'platform-trust',
    )
    expect(defaultProducts.length).toBeGreaterThan(0)
    for (const landing of defaultProducts) {
      expect(landing.primaryCta.label).toBe('Request access')
      expect(landing.secondaryCta).toBeUndefined()
    }
  })
})
