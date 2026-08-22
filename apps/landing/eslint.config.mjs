// Flat config (ESLint 9+/10). `next lint` was removed in Next 16, so linting
// runs through `eslint .` directly. eslint-config-next exposes its presets as
// subpath exports: core-web-vitals and the TypeScript rules.
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['.next/**', '.open-next/**', 'out/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'],
  },
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
];

export default config;