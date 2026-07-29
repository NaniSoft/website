import type { MetaRecord } from 'nextra'

export default {
  index: {
    type: 'page',
    display: 'hidden',
    theme: {
      copyPage: false,
      timestamp: false,
      layout: 'full',
      toc: false,
    },
  },
  blog: {
    type: 'page',
    title: 'Blog',
  },
  courses: {
    type: 'page',
    title: 'Courses',
  },
  whitepapers: {
    type: 'page',
    title: 'Whitepapers',
  },
  'ai-cyber': {
    type: 'page',
    title: 'AI × Cyber',
  },
  about: {
    type: 'page',
    title: 'About',
    theme: {
      toc: false,
      timestamp: false,
    },
  },
} satisfies MetaRecord