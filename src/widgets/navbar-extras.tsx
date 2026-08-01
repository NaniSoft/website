'use client'

import AuthButton from '@/widgets/auth-button'
import MobileMenuAuth from '@/widgets/mobile-menu-auth'
import ThemeToggle from '@/widgets/theme-toggle'

export default function NavbarExtras() {
  return (
    <>
      <ThemeToggle className="max-md:hidden" />
      <AuthButton />
      <MobileMenuAuth />
    </>
  )
}
