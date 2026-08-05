import type { CategoryId } from '@/components/chrome/accents'
import { accentDotClass } from '@/components/chrome/accents'
import { megaMenuGroups } from '@/lib/products'
import { cn } from '@/lib/utils'
import { NavigationMenuLink } from './navigation-menu'

// The Products mega-menu content — a 3-column grid of the 5 product
// categories (wraps 3 + 2 on desktop). Each cell shows the category accent dot
// + name (linking to `/en/products#<categorySlug>`) and the first four product
// names as links to `/en/products#<productSlug>`. Drawn from `megaMenuGroups`
// (single source) so the navbar and the Products grid never diverge. The
// accent dot is non-text (≥3:1 OK); per the design rule, product/category text
// stays ink/zinc, the dot carries the accent.

const FIRST_N = 4

export function ProductsMenu() {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {megaMenuGroups.map((group) => {
        const dotClass = accentDotClass(group.id as CategoryId)
        return (
          <div key={group.id} className="min-w-[12rem]">
            <NavigationMenuLink
              href={group.anchor}
              className="mb-1.5 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground hover:bg-transparent hover:text-foreground"
            >
              <span className={cn('size-2.5 rounded-full', dotClass)} aria-hidden />
              {group.name}
            </NavigationMenuLink>
            <ul className="flex flex-col">
              {group.products.slice(0, FIRST_N).map(p => (
                <li key={p.anchor}>
                  <NavigationMenuLink href={p.anchor} className="block px-2 py-1 text-sm">
                    {p.name}
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
