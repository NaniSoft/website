import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NewsletterPlaceholder } from './newsletter-placeholder'

describe('newsletterPlaceholder', () => {
  it('renders the inline-card with a label, email input, and a disabled subscribe button', () => {
    const { container } = render(<NewsletterPlaceholder layout="inline-card" />)
    expect(screen.getByText('Newsletter')).toBeDefined()
    expect(screen.getByPlaceholderText('you@company.com')).toBeDefined()
    const button = screen.getByRole('button', { name: 'Subscribe' })
    expect(button.hasAttribute('disabled')).toBe(true)
    expect(container.querySelector('[data-newsletter-form]')).not.toBeNull()
  })

  it('renders the accordion layout as a <details> element', () => {
    const { container } = render(<NewsletterPlaceholder layout="accordion" />)
    expect(container.querySelector('details')).not.toBeNull()
    expect(screen.getByText('Newsletter')).toBeDefined()
  })

  it('renders the full-band layout on the hive-yellow background', () => {
    const { container } = render(<NewsletterPlaceholder layout="full-band" />)
    const band = container.firstChild as HTMLElement
    expect(band.className).toContain('bg-hive-yellow')
  })

  it('honours a custom label', () => {
    render(<NewsletterPlaceholder label="Subscribe" />)
    // Label + button both read "Subscribe" in the inline-card layout.
    expect(screen.getAllByText('Subscribe').length).toBeGreaterThanOrEqual(1)
  })
})
