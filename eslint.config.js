import antfu from '@antfu/eslint-config'
import reactHooks from 'eslint-plugin-react-hooks'

const OFF = 0
const WARN = 1
const ERROR = 2

// @antfu/eslint-config@9 wires `@eslint-react` as the `react`/`react-dom`/
// `react-hooks-extra` plugins but does NOT register the official
// `react-hooks` plugin. Register it here so the `react-hooks/*` rules below
// resolve under flat config (without this ESLint 10 hard-fails with
// "could not find plugin react-hooks"). `plugins` is fused into the same
// config object as `rules` by antfu, so the rules resolve.
export default antfu({
  ignores: [
    'public',
    'build',
    'dist',
    'node_modules',
    'coverage',
    'src/assets/**',
    // Next.js-generated; "should not be edited" — Next 16 rewrites the
    // `import` line on every dev/build, so linting it just produces churn.
    'next-env.d.ts',
  ],
  stylistic: {
    indent: 2,
    quotes: 'single',
    overrides: {
      'antfu/top-level-function': 'off',
      'style/arrow-parens': 'off',
      curly: 'off',
    },
  },
  jsonc: true,
  formatters: {
    markdown: true,
  },
  typescript: true,
  react: true,
  markdown: true,
  plugins: {
    'react-hooks': reactHooks,
  },
  rules: {
    'antfu/top-level-function': OFF,
    // @eslint-react ships every rule under the `react` namespace (DOM rules as
    // `react/dom-*`, hooks-extra rules as `react/*`). The earlier config used
    // the non-existent `react-dom` / `react-hooks-extra` namespaces, so those
    // disables were silent no-ops. Use the real rule ids.
    'react/dom-no-unsafe-target-blank': OFF,
    'react/dom-no-missing-button-type': OFF,
    'react/dom-no-dangerously-set-innerhtml': OFF,
    'react-hooks/exhaustive-deps': WARN,
    'react/no-useless-fragment': OFF,
    'react/no-array-index-key': OFF,
    'react-hooks/rules-of-hooks': OFF,
    'react/no-comment-textnodes': OFF,
    'react-refresh/only-export-components': OFF,
    'react/no-unnecessary-use-prefix': OFF,
    // `react/set-state-in-effect` flags standard mount/subscription patterns
    // (setMounted(true), initial DOM measurement, storage sync) that are the
    // recommended Next.js hydration-safe patterns — noise for this template.
    'react/set-state-in-effect': OFF,

    'unused-imports/no-unused-vars': WARN,
    curly: [ERROR, 'multi-line', 'consistent'],

    'no-multiple-empty-lines': [
      ERROR,
      {
        max: 3,
      },
    ],
    'no-console': WARN,

    'style/jsx-self-closing-comp': [ERROR, {
      component: true,
      html: false,
    }],
    'style/no-multiple-empty-lines': [ERROR, {
      max: 2,
      maxEOF: 0,
    }],
    'style/max-statements-per-line': ERROR,
    'style/quote-props': [ERROR, 'as-needed'],

    'ts/no-use-before-define': OFF,
    'ts/ban-ts-comment': OFF,
  },
})
