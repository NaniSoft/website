'use client'

import LocaleToggle from '@/widgets/locale-toggle'
import ThemeToggle from '@/widgets/theme-toggle'

export default function NavbarExtras() {
  return (
    <>
      <LocaleToggle className="max-md:hidden" />
      <ThemeToggle className="max-md:hidden" />
    </>
  )
}