import { describe, expect, it } from 'vitest'
import { crossNavLinks } from '../src/crossNav'

describe('crossNavLinks', () => {
  it('lists the four cross-site destinations with correct hrefs', () => {
    const labels = crossNavLinks.map((l) => l.label)
    expect(labels).toEqual(['Docs', 'Blog', 'About us', 'Contact us'])

    const docs = crossNavLinks.find((l) => l.label === 'Docs')!
    expect(docs.href).toBe('https://docs.nanisoft.com')
    expect(docs.external).toBe(true)

    const blog = crossNavLinks.find((l) => l.label === 'Blog')!
    expect(blog.href).toBe('https://blog.nanisoft.com')
    expect(blog.external).toBe(true)

    const about = crossNavLinks.find((l) => l.label === 'About us')!
    expect(about.href).toBe('https://nanisoft.com/about-us')
    expect(about.external).toBe(true)

    const contact = crossNavLinks.find((l) => l.label === 'Contact us')!
    expect(contact.href).toBe('https://nanisoft.com/about-us#contact')
    expect(contact.external).toBe(true)
  })

  it('carries no banned ask phrases or mailto links', () => {
    const dump = JSON.stringify(crossNavLinks).toLowerCase()
    expect(dump.includes('demo')).toBe(false)
    expect(dump.includes('mailto')).toBe(false)
  })

  it('has no bare href="#" anchors', () => {
    for (const l of crossNavLinks) expect(l.href).not.toBe('#')
  })
})