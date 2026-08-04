import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TopBar } from './top-bar'

describe('topBar', () => {
  it('renders the brand mark linking home', () => {
    render(<TopBar />)
    const brand = screen.getByText('Nanisoft')
    expect(brand.closest('a')?.getAttribute('href')).toBe('/en')
  })

  it('paints the brand square with the lime primary', () => {
    const { container } = render(<TopBar />)
    const square = container.querySelector('.bg-primary')
    expect(square).not.toBeNull()
  })

  it('renders the message when provided', () => {
    render(<TopBar message="Notes from the team" />)
    expect(screen.getByText('Notes from the team')).toBeDefined()
  })

  it('omits the message separator when no message is given', () => {
    const { container } = render(<TopBar />)
    expect(container.textContent).not.toContain('·')
  })

  it('renders right-hand children', () => {
    render(
      <TopBar>
        <a href="/en/blog">Blog</a>
      </TopBar>,
    )
    expect(screen.getByText('Blog').closest('a')?.getAttribute('href')).toBe('/en/blog')
  })
})
