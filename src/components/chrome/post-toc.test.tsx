import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PostTOC } from './post-toc'

// Pure-render assertions — no Nextra/Next runtime. The contract the blog post
// page relies on: a sticky `<nav>` of in-page anchor links, one per heading,
// labelled "Table of contents", that clears the sticky navbar (scroll-margin
// is global on `:target`, so the link href alone is the testable contract).
const HEADINGS = [
  { id: 'the-gap', label: 'The gap' },
  { id: 'the-answer', label: 'The answer' },
  { id: 'the-first-chapter', label: 'The first chapter' },
]

describe('postTOC', () => {
  it('renders a nav labelled "Table of contents"', () => {
    const { container } = render(<PostTOC headings={HEADINGS} />)
    const nav = container.querySelector('nav')
    expect(nav).not.toBeNull()
    expect(nav?.getAttribute('aria-label')).toBe('Table of contents')
  })

  it('renders one anchor per heading, linking to #<id>', () => {
    const { container } = render(<PostTOC headings={HEADINGS} />)
    const links = container.querySelectorAll('nav a')
    expect(links).toHaveLength(3)
    expect(links[0].getAttribute('href')).toBe('#the-gap')
    expect(links[0].textContent).toBe('The gap')
    expect(links[2].getAttribute('href')).toBe('#the-first-chapter')
  })

  it('renders nothing when there are no headings', () => {
    const { container } = render(<PostTOC headings={[]} />)
    expect(container.querySelector('nav')).toBeNull()
  })
})
