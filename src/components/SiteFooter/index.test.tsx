import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SiteFooter } from './index'

// Pure-render assertions — no Nextra/Next runtime. The footer is a server
// component rendering native HTML (<footer>, <details>, <a>), so jsdom covers
// the contract: 4 columns, flagship product anchors, env-driven social
// omission, the bottom-row copyright, and the mobile <details> accordions.

describe('siteFooter', () => {
  it('renders a <footer> landmark with the brand mark', () => {
    const { container } = render(<SiteFooter />)
    expect(container.querySelector('footer')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Nanisoft' })).toHaveAttribute('href', '/en')
  })

  it('renders the six flagship product links resolving to /en/products#<slug>', () => {
    render(<SiteFooter />)
    for (const name of ['Atlas', 'Bedrock', 'Keystone', 'Compass', 'Sentinel', 'Meridian']) {
      // `name` is a hard-coded literal from the list above; an exact string
      // match (Testing Library defaults to exact) avoids constructing a RegExp
      // from it (security/detect-non-literal-regexp).
      const link = screen.getByRole('link', { name })
      expect(link.getAttribute('href')).toMatch(`/en/products#${name.toLowerCase()}`)
    }
  })

  it('renders the Resources and Company link columns', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', '/en/docs')
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/en/blog')
    expect(screen.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '/en/changelog')
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/en/about')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/en/contact')
  })

  it('omits the Press Kit link when the env URL is unset', () => {
    render(<SiteFooter />)
    // pressKitUrl defaults to '' (see src/lib/site-config.ts) — no Press Kit link.
    expect(screen.queryByRole('link', { name: /press kit/i })).toBeNull()
  })

  it('renders the configured GitHub social and omits unconfigured ones', () => {
    render(<SiteFooter />)
    // githubUrl always defaults to the real org.
    const gh = screen.getByRole('link', { name: 'GitHub' })
    expect(gh.getAttribute('href')).toMatch(/github\.com\/nanisoft/)
    expect(gh).toHaveAttribute('target', '_blank')
    // The other three are omitted when their env var is empty (the default).
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Discord' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'YouTube' })).toBeNull()
  })

  it('renders the © <year> Nanisoft bottom row', () => {
    const { container } = render(<SiteFooter />)
    const footer = container.querySelector('footer')!
    expect(footer.textContent).toMatch(/©\s*\d{4}\s*Nanisoft/)
  })

  it('collapses the three link columns into <details> accordions', () => {
    const { container } = render(<SiteFooter />)
    // Brand column is a plain div; Products / Resources / Company are <details>.
    const details = container.querySelectorAll('footer details')
    expect(details).toHaveLength(3)
    const summaries = container.querySelectorAll('footer summary')
    // The summary text includes the mobile chevron (▾); strip it for the check.
    expect([...summaries].map(s => s.textContent?.trim().replace(/▾$/, ''))).toEqual([
      'Products',
      'Resources',
      'Company',
    ])
  })
})
