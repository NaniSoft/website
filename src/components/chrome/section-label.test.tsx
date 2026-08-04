import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SectionLabel } from './section-label'

// Pure-render assertions — no Nextra/Next runtime. The dot's accent class and
// data-accent attribute are the contract every surface relies on.
describe('sectionLabel', () => {
  it('renders the label text', () => {
    render(<SectionLabel>Blog</SectionLabel>)
    expect(screen.getByText('Blog')).toBeDefined()
  })

  it('uses the lime primary dot by default', () => {
    const { container } = render(<SectionLabel>Section</SectionLabel>)
    const dot = container.querySelector('[data-accent]')
    expect(dot?.getAttribute('data-accent')).toBe('primary')
    expect(dot?.className).toContain('bg-primary')
  })

  it('renders the category accent class for a given category', () => {
    const { container } = render(<SectionLabel category="ingestion">Ingestion</SectionLabel>)
    const dot = container.querySelector('[data-accent]')
    expect(dot?.getAttribute('data-accent')).toBe('ingestion')
    expect(dot?.className).toContain('bg-ingestion')
  })

  it('maps the query-traversal category id to the qt token', () => {
    const { container } = render(<SectionLabel category="query-traversal">Q&T</SectionLabel>)
    const dot = container.querySelector('[data-accent]')
    expect(dot?.getAttribute('data-accent')).toBe('query-traversal')
    expect(dot?.className).toContain('bg-qt')
  })

  it('renders the platform-trust accent class', () => {
    const { container } = render(<SectionLabel category="platform-trust">Platform</SectionLabel>)
    const dot = container.querySelector('[data-accent]')
    expect(dot?.className).toContain('bg-platform')
  })
})
