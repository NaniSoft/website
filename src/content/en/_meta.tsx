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
  introduction: {
    type: 'page',
    title: 'This is Introduction',
    theme: {
      copyPage: false,
      navbar: true,
      toc: false,
    },
  },
  login: {
    type: 'page',
    title: 'Login',
    display: 'hidden',
    theme: {
      navbar: false,
      footer: false,
      toc: false,
      layout: 'full',
      timestamp: false,
    },
  },
  'ai-demo': {
    type: 'page',
    display: 'hidden',
    theme: {
      copyPage: false,
      toc: false,
      timestamp: false,
      layout: 'full',
    },
  },
  docs: {
    title: '📦 Some Examples',
    type: 'page',
  },
} satisfies MetaRecord
