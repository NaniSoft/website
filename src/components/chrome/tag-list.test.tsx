import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TagList } from './tag-list'

// Pure-render assertions — no Nextra/Next runtime. The contract: a list of
// accent-dot tag pills, the dot carrying the category accent class (the
// design rule: the dot is the accent, the label stays ink).
const TAGS = [
  { label: 'Origin', category: 'core' as const },
  { label: 'Attack paths', category: 'query-traversal' as const },
]

describe('tagList', () => {
  it('renders one pill per tag with the label text', () => {
    const { container } = render(<TagList tags={TAGS} />)
    const items = container.querySelectorAll('li')
    expect(items).toHaveLength(2)
    expect(container.textContent).toContain('Origin')
    expect(container.textContent).toContain('Attack paths')
  })

  it('paints the category accent on each dot', () => {
    const { container } = render(<TagList tags={TAGS} />)
    const dots = container.querySelectorAll('[data-accent]')
    expect(dots[0].getAttribute('data-accent')).toBe('core')
    expect(dots[0].className).toContain('bg-core')
    expect(dots[1].getAttribute('data-accent')).toBe('query-traversal')
    expect(dots[1].className).toContain('bg-qt')
  })

  it('renders nothing when there are no tags', () => {
    const { container } = render(<TagList tags={[]} />)
    expect(container.querySelector('ul')).toBeNull()
  })
})
