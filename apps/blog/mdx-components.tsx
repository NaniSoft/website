import { useMDXComponents as getThemeComponents } from 'nextra-theme-blog'
import MdxWrapper from './app/mdx-wrapper'

const themeComponents = getThemeComponents()

export function useMDXComponents(components: Record<string, unknown>) {
  return {
    ...themeComponents,
    // The app's own wrapper replaces the theme's (h1 + <Meta>): ISO dates, a
    // category pill instead of the theme's router.back() GoBack, and no empty
    // 32px post-header block on index pages. See ./mdx-wrapper.tsx.
    wrapper: MdxWrapper,
    ...components,
  }
}
