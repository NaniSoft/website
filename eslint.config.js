import antfu from '@antfu/eslint-config'
import boundaries from 'eslint-plugin-boundaries'
import promise from 'eslint-plugin-promise'
import reactHooks from 'eslint-plugin-react-hooks'
import security from 'eslint-plugin-security'
import sonarjs from 'eslint-plugin-sonarjs'

const OFF = 0
const WARN = 1
const ERROR = 2

// @antfu/eslint-config@9 wires `@eslint-react` as the `react`/`react-dom`/
// `react-hooks-extra` plugins but does NOT register the official
// `react-hooks` plugin. Register it here so the `react-hooks/*` rules below
// resolve under flat config (without this ESLint 10 hard-fails with
// "could not find plugin react-hooks"). `plugins` is fused into the same
// config object as `rules` by antfu, so the rules resolve.
//
// antfu already bundles equivalents of several plugins from the enterprise
// stack (unicorn, perfectionist/sort, unused-imports, import-x,
// typescript-eslint, react, react-hooks). We only layer on the genuinely
// complementary ones below: sonarjs (code smells), security (unsafe patterns),
// promise (async hygiene), boundaries (architecture). Curated rule sets are
// used instead of each plugin's full `recommended` — the security and sonarjs
// recommended sets are noisy and several sonarjs rules need type-info, which
// would break the build. The split: correctness + debug-footgun rules are
// `error` (the build must fail on them), while noisy heuristics (sonarjs
// duplicate-string, react-hooks/exhaustive-deps, react/no-array-index-key,
// boundaries) stay `warn` so they surface without forcing changes that could
// alter rendering/animation behavior.
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
    // Tooling-generated / non-app: keep lint off these.
    '.next/**',
    'e2e/**',
    'playwright-report/**',
    'test-results/**',
    'coverage/**',
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
    // Array-index keys can break reconciliation for reordering/animation.
    // Surfaced as `warn` (not `error`) because changing existing keys in
    // animated lists (HomepageHero, card-hover-effect, loader) would alter
    // framer-motion/layout behavior — out of scope for a lint pass.
    'react/no-array-index-key': WARN,
    // Rules of Hooks is a correctness invariant, not style — promoted to
    // `error`. `exhaustive-deps` stays `warn`: its false positives and the
    // dep additions it implies can re-trigger effects/animations, so we
    // surface rather than force.
    'react-hooks/rules-of-hooks': ERROR,
    'react/no-comment-textnodes': OFF,
    'react-refresh/only-export-components': OFF,
    'react/no-unnecessary-use-prefix': OFF,
    // `react/set-state-in-effect` flags standard mount/subscription patterns
    // (setMounted(true), initial DOM measurement, storage sync) that are the
    // recommended Next.js hydration-safe patterns — noise for this template.
    'react/set-state-in-effect': OFF,

    'unused-imports/no-unused-vars': ERROR,
    curly: [ERROR, 'multi-line', 'consistent'],

    'no-multiple-empty-lines': [
      ERROR,
      {
        max: 3,
      },
    ],
    // --- production hardening: forbid debug/eval/alert footguns and console
    //     noise. `no-console` is `error` — the codebase has zero `console.*`
    //     calls in source (the lone `console.log` lives in an MDX code
    //     example, which the markdown linter does not type-check as JS).
    'no-console': ERROR,
    'no-debugger': ERROR,
    'no-alert': ERROR,
    'no-eval': ERROR,
    'no-param-reassign': ERROR,

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

    // --- sonarjs: code smells (non-typed subset) -----------------------
    'sonarjs/no-duplicate-string': [WARN, { threshold: 6 }],
    'sonarjs/no-duplicated-branches': ERROR,
    'sonarjs/no-identical-conditions': ERROR,
    'sonarjs/no-identical-expressions': ERROR,
    'sonarjs/no-use-of-empty-return-value': ERROR,
    'sonarjs/no-redundant-jump': WARN,
    'sonarjs/no-small-switch': WARN,
    'sonarjs/no-collection-size-mischeck': ERROR,
    'sonarjs/no-empty-collection': WARN,
    'sonarjs/prefer-single-boolean-return': WARN,

    // --- security: unsafe patterns (curated; detect-object-injected
    //     omitted — too noisy for normal object access) ----------------
    'security/detect-non-literal-regexp': ERROR,
    'security/detect-unsafe-regex': ERROR,
    'security/detect-eval-with-expression': ERROR,
    'security/detect-new-buffer': ERROR,
    'security/detect-pseudoRandomBytes': WARN,
    'security/detect-non-literal-fs-filename': WARN,

    // --- promise: async hygiene (always-return / catch-or-return
    //     omitted — noisy in React useEffect/event handlers) ----------
    'promise/param-names': ERROR,
    'promise/no-new-statics': ERROR,
    'promise/no-return-wrap': ERROR,
    'promise/valid-params': WARN,

    // --- boundaries: architecture. Permissive default (`allow`) so this
    //     never breaks the build; only the explicit disallows below fire,
    //     and they fire as `warn`. lib/i18n are leaves and must not climb
    //     back up into app/components/hooks. v7 uses the `dependencies`
    //     rule with object selectors: `{ element: { type: 'x' } }` /
    //     `{ element: { types: { anyOf: [...] } } }`.
    'boundaries/dependencies': [WARN, {
      default: 'allow',
      policies: [
        { from: { element: { type: 'lib' } }, disallow: { element: { types: { anyOf: ['app', 'components', 'hooks'] } } } },
        { from: { element: { type: 'i18n' } }, disallow: { element: { types: { anyOf: ['app', 'components', 'hooks'] } } } },
        { from: { element: { type: 'hooks' } }, disallow: { element: { type: 'app' } } },
      ],
    }],
    'boundaries/no-unknown-files': OFF,
    'boundaries/no-private': OFF,
    'boundaries/no-ignored-dependencies': OFF,
  },
}).then(configs => [
  ...configs,
  // Register the plugins that aren't already wired by antfu. boundaries'
  // recommended config omits the `plugins` field, so it must be registered
  // explicitly; sonarjs/security/promise are registered here too so the
  // rule namespaces resolve regardless of antfu's own plugin assembly.
  {
    name: 'enterprise-plugins/register',
    plugins: {
      sonarjs,
      security,
      promise,
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**', partialMatch: false },
        { type: 'components', pattern: 'src/components/**', partialMatch: false },
        { type: 'hooks', pattern: 'src/hooks/**', partialMatch: false },
        { type: 'lib', pattern: 'src/lib/**', partialMatch: false },
        { type: 'i18n', pattern: 'src/i18n/**', partialMatch: false },
        { type: 'content', pattern: 'src/content/**', partialMatch: false },
      ],
    },
  },
])
