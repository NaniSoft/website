import { i18nConfig } from './index'

interface HeroCopy {
  title: string
  subtitle: string
  tryDemo: string
  bookCall: string
  startTrial: string
  trust: string
}

interface SocialProof {
  logos: string[]
  stats: Array<{ label: string, value: string }>
}

interface Feature {
  title: string
  description: string
}

interface Step {
  title: string
  description: string
}

interface UseCase {
  title: string
  description: string
}

interface Testimonial {
  quote: string
  name: string
  role: string
}

export interface Plan {
  name: string
  price: string
  description: string
  points: string[]
  cta: string
  highlight?: boolean
}

interface FAQ {
  question: string
  answer: string
}

interface FinalCta {
  title: string
  description: string
  primary: string
  secondary: string
}

interface Footer {
  productName: string
  copyright: string
  contactTitle: string
  contactEmail: string
  contactPhone: string
}

export interface LandingCopy {
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

export function getLandingCopy(): LandingCopy {
  return i18nConfig.en.aiDemo as LandingCopy
}
