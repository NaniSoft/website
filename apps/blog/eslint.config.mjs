// Flat config (ESLint 9+/10). `next lint` was removed in Next 16, so linting
// runs through `eslint .` directly. eslint-config-next exposes its presets as
// subpath exports: core-web-vitals and the TypeScript rules. Each subpath
// exports a `Linter.Config[]` (flat-config array), so we default-import and
// spread it — same pattern as apps/docs, apps/landing and apps/playground.
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['out/**', '.next/**', 'node_modules/**', 'next-env.d.ts', '**/*.mdx'],
  },
];

export default config;