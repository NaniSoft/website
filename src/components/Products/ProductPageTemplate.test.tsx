import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProductPageTemplate } from './ProductPageTemplate'
import { landingBySlug } from './products-content'

// Pure-render assertions — no Nextra/Next runtime. The template is a server
// component rendering native HTML, so jsdom covers the contract: the
// per-category accent marker class, the feature checkmarks, and the correct
// CTA shape per access model (Pathfinder / Aperture / Platform & Trust /
// default). The data comes from `products-content.ts` so the test pins the
// real landing copy, not a hand-rolled fixture.

function landing(slug: string) {
  const landing = landingBySlug(slug)
  if (!landing) {
    throw new Error(`Unknown product slug: ${slug}`)
  }
  return landing
}

describe('productPageTemplate', () => {
  it('renders the per-category accent marker class on its root', () => {
    const { container } = render(
      <ProductPageTemplate product={landing('atlas')} />,
    )
    expect(container.firstElementChild).toHaveClass('accent-core')

    const { container: qt } = render(<ProductPageTemplate product={landing('pathfinder')} />)
    expect(qt.firstElementChild).toHaveClass('accent-qt')

    const { container: ifc } = render(<ProductPageTemplate product={landing('aperture')} />)
    expect(ifc.firstElementChild).toHaveClass('accent-interfaces')

    const { container: plt } = render(<ProductPageTemplate product={landing('compass')} />)
    expect(plt.firstElementChild).toHaveClass('accent-platform')
  })

  it('renders the product name as the h1 and the line as the lede', () => {
    const atlas = landing('atlas')
    render(<ProductPageTemplate product={atlas} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Atlas' })).toBeInTheDocument()
    // Exact string match — the hero lede <p> holds the line verbatim; the body
    // <p> appends a follow-on sentence, so exact match scopes to the lede only.
    expect(screen.getByText(atlas.line)).toBeInTheDocument()
  })

  it('renders every feature checkmark', () => {
    const atlas = landing('atlas')
    render(<ProductPageTemplate product={atlas} />)
    for (const feature of atlas.features) {
      // Exact string match — no RegExp built from data (security rule).
      expect(screen.getByText(feature)).toBeInTheDocument()
    }
  })

  it('renders the default "Request access" CTA with no secondary for a Core product', () => {
    render(<ProductPageTemplate product={landing('atlas')} />)
    const primary = screen.getByRole('link', { name: /Request access/i })
    expect(primary).toHaveAttribute('href', '/en#get-in-touch')
    expect(screen.queryByRole('link', { name: /View all products/i })).toBeNull()
  })

  it('renders "Try" + "View all products" for Pathfinder (gateway)', () => {
    render(<ProductPageTemplate product={landing('pathfinder')} />)
    expect(screen.getByRole('link', { name: /Try Pathfinder/i })).toHaveAttribute(
      'href',
      '/en#get-in-touch',
    )
    expect(screen.getByRole('link', { name: /View all products/i })).toHaveAttribute(
      'href',
      '/en/products',
    )
  })

  it('renders "Open the console" + "Read the docs" for Aperture', () => {
    render(<ProductPageTemplate product={landing('aperture')} />)
    expect(screen.getByRole('link', { name: /Open the console/i })).toHaveAttribute(
      'href',
      '/en#get-in-touch',
    )
    expect(screen.getByRole('link', { name: /Read the docs/i })).toHaveAttribute(
      'href',
      '/en/docs',
    )
  })

  it('renders "Talk to the team" with no secondary for a Platform & Trust product', () => {
    render(<ProductPageTemplate product={landing('compass')} />)
    expect(screen.getByRole('link', { name: /Talk to the team/i })).toHaveAttribute(
      'href',
      '/en#get-in-touch',
    )
    expect(screen.queryByRole('link', { name: /View all products/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /Read the docs/i })).toBeNull()
  })

  it('puts hive-focus on the CTAs', () => {
    render(<ProductPageTemplate product={landing('atlas')} />)
    const primary = screen.getByRole('link', { name: /Request access/i })
    expect(primary).toHaveClass('hive-focus')
  })
})
