import type En from '@/i18n/en'
import 'server-only'

// We enumerate all dictionaries here for better linting and TypeScript support
// We also get the default import for cleaner types
const dictionaries = {
  en: () => import('@/i18n/en'),
} as const satisfies Record<string, () => Promise<{ default: typeof En }>>

export const getDictionary = async (
  locale: keyof typeof dictionaries,
): Promise<typeof En> => (await dictionaries[locale]()).default

// Single-locale (`en`) site — every supported locale is LTR. The parameter
// is retained so that adding an RTL locale later only needs a branch here,
// not a call-site change in `layout.tsx`.
export const getDirection = (_locale: keyof typeof dictionaries): 'ltr' => 'ltr'
