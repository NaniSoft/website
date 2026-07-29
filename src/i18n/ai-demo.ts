import type { I18nLangKeys } from './index'
import { i18nConfig } from './index'

type HeroCopy = {
  title: string
  subtitle: string
  tryDemo: string
  bookCall: string
  startTrial: string
  trust: string
}

type SocialProof = {
  logos: string[]
  stats: Array<{ label: string, value: string }>
}

type Feature = {
  title: string
  description: string
}

type Step = {
  title: string
  description: string
}

type UseCase = {
  title: string
  description: string
}

type Testimonial = {
  quote: string
  name: string
  role: string
}

export type Plan = {
  name: string
  price: string
  description: string
  points: string[]
  cta: string
  highlight?: boolean
}

type FAQ = {
  question: string
  answer: string
}

type FinalCta = {
  title: string
  description: string
  primary: string
  secondary: string
}

type Footer = {
  productName: string
  copyright: string
  contactTitle: string
  contactEmail: string
  contactPhone: string
}

export type LandingCopy = {
  nav: {
    product: string
    tryDemo: string
    bookCall: string
    startTrial: string
  }
  hero: HeroCopy
  socialProofTitle: string
  socialProof: SocialProof
  featureTitle: string
  features: Feature[]
  howItWorksTitle: string
  steps: Step[]
  useCasesTitle: string
  useCases: UseCase[]
  demoTitle: string
  demoDescription: string
  testimonialsTitle: string
  testimonials: Testimonial[]
  pricingTitle: string
  pricingSubtitle: string
  plans: Plan[]
  faqTitle: string
  faqs: FAQ[]
  finalCta: FinalCta
  footer: Footer
}

export function getLandingCopy(lang: string): LandingCopy {
  // Resolve against the registered locale keys, falling back to the default ('en').
  // Add new locales to `i18nConfig` and they resolve automatically here.
  const knownLocales = Object.keys(i18nConfig) as I18nLangKeys[]
  const safeLang: I18nLangKeys = knownLocales.includes(lang as I18nLangKeys)
    ? (lang as I18nLangKeys)
    : 'en'
  return i18nConfig[safeLang].aiDemo as LandingCopy
}
