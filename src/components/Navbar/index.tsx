'use client'

// The Nanisoft sticky navbar — the chosen chrome (variant A of the chrome
// prototype). Desktop: a Radix NavigationMenu with a hover-open Products
// mega-menu (3-column, grouped by the 5 categories) plus Blog / About /
// Changelog / Contact links, a GitHub icon, a theme toggle, and the lime
// "Talk to us" pill. `delayDuration={0}` opens instantly on hover; Radix's
// built-in ~150ms close-after-pointer-leave keeps the panel from being yanked
// away while the cursor travels from trigger to content. Mobile: a hamburger
// opens a framer-motion slide-out from the right (200ms) carrying the same
// links, with Products as a `<details>` accordion of the 5 categories.
//
// The bar height is governed by Nextra's navbar wrapper, which consumes
// `--nextra-navbar-height` (82px desktop / 64px mobile) — this component adds
// no hardcoded height. Focus rings come from the global `.hive-focus` rule
// (every `<a>`/`<button>` gets the lime ring on `:focus-visible`).

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { megaMenuGroups } from '@/lib/products'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/widgets/theme-toggle'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './navigation-menu'
import { ProductsMenu } from './products-menu'

const NAV_LINKS = [
  { href: '/en/blog', label: 'Blog' },
  { href: '/en/about', label: 'About' },
  { href: '/en/changelog', label: 'Changelog' },
  { href: '/en/contact', label: 'Contact' },
] as const

const TOP_LINK_CLASS
  = 'text-base font-medium tracking-tight text-zinc-600 hover:bg-transparent hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100'

function BrandMark({ className }: { className?: string }) {
  return (
    <a
      href="/en"
      className={cn('flex items-center gap-2 text-base font-semibold tracking-tight text-foreground', className)}
    >
      <span className="inline-block size-2.5 rounded-sm bg-primary" aria-hidden />
      <span>Nanisoft</span>
    </a>
  )
}

function TalkToUs({ className }: { className?: string }) {
  return (
    <a
      href="/en/contact"
      className={cn(
        'inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90',
        className,
      )}
    >
      Talk to us
    </a>
  )
}

/**
 * Nanisoft navbar. Rendered as the `navbar` prop of Nextra's `<Layout>` (a
 * client component element passed from the server layout). `githubUrl` is
 * passed from the server (read from `site-config.ts` at runtime) — this is a
 * client component, so it cannot read `process.env` directly.
 */
export function Navbar({ githubUrl }: { githubUrl: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close the mobile slide-out on Escape.
  useEffect(() => {
    if (!mobileOpen) {
      return
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  // Lock body scroll while the mobile slide-out is open.
  useEffect(() => {
    if (!mobileOpen) {
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  return (
    <div className="sticky top-0 z-40 border-b border-zinc-200 bg-beige-100/90 backdrop-blur dark:border-zinc-800 dark:bg-dark/90">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6">
        <BrandMark />

        {/* Desktop nav */}
        <NavigationMenu delayDuration={0} className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent className="w-[28rem] max-w-[92vw] sm:w-[34rem] lg:w-[40rem]">
                <ProductsMenu />
              </NavigationMenuContent>
            </NavigationMenuItem>
            {NAV_LINKS.map(l => (
              <NavigationMenuItem key={l.href}>
                <NavigationMenuLink href={l.href} className={TOP_LINK_CLASS}>
                  {l.label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex-1" />

        {/* Right cluster — desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <span className="icon-[simple-icons--github] text-lg" />
            </a>
          )}
          <ThemeToggle />
          <TalkToUs />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(open => !open)}
          className="ml-auto inline-flex size-9 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 md:hidden dark:border-zinc-700 dark:text-zinc-200"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile slide-out */}
      <AnimatePresence>
        {mobileOpen && (
          <MobileNav onClose={() => setMobileOpen(false)} githubUrl={githubUrl} />
        )}
      </AnimatePresence>
    </div>
  )
}

function MobileNav({ onClose, githubUrl }: { onClose: () => void, githubUrl: string }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel — slides in from the right (200ms) */}
      <motion.nav
        aria-label="Mobile navigation"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col border-l border-zinc-200 bg-background p-6 md:hidden dark:border-zinc-800"
      >
        <div className="flex items-center justify-between">
          <BrandMark />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {/* Products as an expandable group of the 5 categories. */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-2 text-base font-medium tracking-tight text-zinc-700 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
              Products
              <span
                aria-hidden
                className="ml-auto text-zinc-400 transition-transform duration-200 group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <ul className="flex flex-col gap-0.5 pl-3">
              {megaMenuGroups.map(group => (
                <li key={group.id}>
                  <a
                    href={group.anchor}
                    onClick={onClose}
                    className="block rounded-md px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                  >
                    {group.name}
                  </a>
                </li>
              ))}
            </ul>
          </details>
          {NAV_LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={onClose}
              className="rounded-md px-2 py-2 text-base font-medium tracking-tight text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4 pt-6">
          <div className="flex items-center justify-between">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                onClick={onClose}
                className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <span className="icon-[simple-icons--github] text-lg" />
              </a>
            )}
            <ThemeToggle />
          </div>
          <TalkToUs className="w-full justify-center" />
        </div>
      </motion.nav>
    </>
  )
}
