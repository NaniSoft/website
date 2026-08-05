'use client'

// Thin wrappers over the Radix NavigationMenu primitives (from the unified
// `radix-ui` package), styled with the nanisoft token system and the
// fade + ~4px slide open/close motion. Adapted from the reference chrome
// pattern: `delayDuration={0}` on the Root for an instant open, and Radix's
// built-in ~150ms close-after-pointer-leave keeps the panel from being yanked
// away while the cursor travels from trigger to content. The motion classes
// read Radix's `data-motion` attributes (`from-*` on enter, `to-*` on exit).

import type { ComponentPropsWithoutRef } from 'react'
import { NavigationMenu as NavigationMenuPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export function NavigationMenu({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>) {
  return (
    <NavigationMenuPrimitive.Root
      aria-label="Navigation Menu"
      className={cn('relative flex flex-1 items-center', className)}
      {...rest}
    >
      {children}
      <NavigationMenuViewport />
    </NavigationMenuPrimitive.Root>
  )
}

export function NavigationMenuList({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      className={cn('flex flex-1 list-none items-center', className)}
      {...rest}
    />
  )
}

export const NavigationMenuItem = NavigationMenuPrimitive.Item

export function NavigationMenuTrigger({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      // `group` so the chevron can rotate via `group-data-[state=open]` — Radix
      // toggles `data-state="open"` on the trigger. (An `[aria-expanded=true_&]`
      // arbitrary variant compiles to a bare, bracket-less attribute selector
      // that PostCSS rejects under Turbopack dev — `data-state` + group avoids it.)
      className={cn(
        'group inline-flex h-9 items-center gap-1 rounded-md px-3 text-base font-medium tracking-tight text-zinc-600 transition-colors hover:text-zinc-900 aria-expanded:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 dark:aria-expanded:text-zinc-100',
        className,
      )}
      {...rest}
    >
      {children}
      <span
        aria-hidden
        className="icon-[ri--arrow-down-s-line] size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

// Fade + ~4px slide on open/close (~150ms ease-out). `slide-in-from-top-1` is
// 4px (0.25rem). The `data-motion` attributes are set by Radix on enter/exit
// and on switching between items (from-start / from-end).
const CONTENT_MOTION
  = 'data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in-90 data-[motion^=to-]:fade-out data-[motion^=from-]:slide-in-from-top-1 data-[motion^=to-]:slide-out-to-top-1 data-[motion^=from-]:ease-out data-[motion^=from-]:![animation-duration:150ms] data-[motion^=to-]:![animation-duration:150ms]'

export function NavigationMenuContent({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      // No width here — the caller must set one (e.g. `w-[40rem]`). With
      // `w-full`/`w-auto` the content shrink-to-fits to the viewport width,
      // which Radix derives from the content width — circular, so it collapses
      // to ~the trigger width and the grid cells overlap. An explicit width
      // breaks the cycle and Radix sizes the viewport to match.
      className={cn(
        'absolute left-0 top-0 bg-background [&>:first-child]:p-5',
        CONTENT_MOTION,
        className,
      )}
      {...rest}
    />
  )
}

export interface NavigationMenuLinkProps
  extends ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link> {
  href: string
}

export function NavigationMenuLink({
  className,
  href,
  children,
  ...rest
}: NavigationMenuLinkProps) {
  return (
    <NavigationMenuPrimitive.Link
      href={href}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
        className,
      )}
      {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </NavigationMenuPrimitive.Link>
  )
}

function NavigationMenuViewport({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="absolute left-0 top-full pt-3">
      {/* `h-[var(--radix-navigation-menu-viewport-height)]` is load-bearing: the
         Content is `absolute` (out of flow), so without an explicit height the
         viewport collapses to 0 and `overflow-hidden` clips every link — they
         report a bounding box and pass `toBeVisible` but are not painted or
         hit-testable. Radix sets this var to the active content's measured
         height. */}
      <NavigationMenuPrimitive.Viewport
        className={cn(
          'relative h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)] origin-top overflow-hidden rounded-xl border border-zinc-200 bg-background shadow-[0px_16px_32px_-12px_rgba(0,0,0,0.18)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-90 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 dark:border-zinc-800',
          className,
        )}
        {...rest}
      />
    </div>
  )
}
