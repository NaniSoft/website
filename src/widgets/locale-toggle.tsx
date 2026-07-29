'use client'

import clsx from 'clsx'
import { addBasePath } from 'next/dist/client/add-base-path'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { useLocale } from '@/hooks'
import { i18nConfig } from '@/i18n'

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000

// Display metadata per registered locale. Add an entry here when adding a locale.
const LOCALE_META: Record<string, { name: string, icon: string }> = {
  en: { name: 'English', icon: 'icon-[ri--english-input]' },
}

/**
 * Quick locale switcher that overrides Nextra's native locale dropdown.
 * Driven by the locales registered in `i18nConfig`, so it stays correct as
 * locales are added. With a single locale it renders nothing (nothing to
 * switch to); with two it toggles between them. For more than two, replace
 * this with a menu (see CLAUDE.md "Add/rename a language").
 */
export default function LocaleToggle({
  className,
}: {
  className?: string
}) {
  const { currentLocale } = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const locales = Object.keys(i18nConfig)

  const forceHideBanner = useCallback(() => {
    const banner = document.querySelector('.nextra-banner')
    if (!banner) {
      return
    }

    const isBannerDismissed = localStorage.getItem('starter-banner')
    if (isBannerDismissed) {
      banner.classList.add('x:hidden')
    }
  }, [])

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        forceHideBanner()
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    forceHideBanner()
    return () => observer.disconnect()
  }, [forceHideBanner])

  const changeLocale = useCallback(() => {
    // Remember the current scroll position
    const currentPosition = window.scrollY
    // Check whether the page is scrolled to the bottom
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight

    const nextHref = {
      value: '',
    }
    // Toggle to the "other" locale when exactly two are registered.
    if (locales.length === 2) {
      const next = locales.find(locale => locale !== currentLocale) ?? currentLocale
      nextHref.value = addBasePath(pathname.replace(`/${currentLocale}`, `/${next}`))
    }
    else {
      nextHref.value = addBasePath(pathname)
    }

    const date = new Date(Date.now() + ONE_YEAR)
    document.cookie = `NEXT_LOCALE=${currentLocale}; expires=${date.toUTCString()}; path=/`

    router.replace(nextHref.value)

    // Restore the scroll position after the route change
    requestAnimationFrame(() => {
      if (isAtBottom) {
        window.scrollTo(0, document.body.scrollHeight)
      }
      else {
        window.scrollTo(0, currentPosition)
      }
    })
  }, [currentLocale, locales, pathname, router])

  // Nothing to toggle when fewer than two locales are registered.
  if (locales.length < 2) {
    return null
  }

  const icon = LOCALE_META[currentLocale]?.icon ?? 'icon-[ri--english-input]'

  return (
    <Toggle
      size="sm"
      className={clsx([
        'cursor-pointer',
        className,
      ])}
      onClick={changeLocale}
    >
      <span className={icon} />
    </Toggle>
  )
}