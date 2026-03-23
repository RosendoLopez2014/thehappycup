'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { ClipboardList, UtensilsCrossed, Users, Settings, Menu, X, ExternalLink, Package } from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: '/admin',
    label: 'Orders',
    icon: <ClipboardList className="w-5 h-5 shrink-0" />,
  },
  {
    href: '/admin/menu',
    label: 'Menu',
    icon: <UtensilsCrossed className="w-5 h-5 shrink-0" />,
  },
  {
    href: '/admin/customers',
    label: 'Customers',
    icon: <Users className="w-5 h-5 shrink-0" />,
  },
  {
    href: '/admin/ingredients',
    label: 'Ingredients',
    icon: <Package className="w-5 h-5 shrink-0" />,
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5 shrink-0" />,
  },
]

function NavLinks({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-warm-600 text-white'
                : 'text-warm-100 hover:bg-warm-700 hover:text-white',
            ].join(' ')}
          >
            {item.icon}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-warm-700 min-h-screen">
        {/* Logo */}
        <div className="flex items-center px-4 py-5 border-b border-warm-600">
          <Image
            src="/logo/header/header-logo-white.png"
            alt="The Happy Cup"
            width={400}
            height={100}
            className="object-contain h-auto w-full"
          />
        </div>

        <div className="py-4 flex-1">
          <NavLinks pathname={pathname} />
        </div>

        <div className="px-3 py-4 border-t border-warm-600">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-warm-300 hover:bg-warm-700 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Mobile top bar — fixed so it stays at top during scroll */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-warm-700 border-b border-warm-600 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center -my-1">
          <Image
            src="/logo/header/header-logo-white.png"
            alt="The Happy Cup"
            width={300}
            height={70}
            className="object-contain h-14 w-auto max-w-[200px]"
          />
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="text-warm-100 hover:text-white p-2 rounded-md w-11 h-11 flex items-center justify-center"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown nav — fixed below top bar */}
      {mobileOpen && (
        <div className="md:hidden bg-warm-700 border-b border-warm-600 py-3 fixed top-16 left-0 right-0 z-40 shadow-lg">
          <NavLinks pathname={pathname} onClose={() => setMobileOpen(false)} />
          <div className="px-3 mt-2 pt-2 border-t border-warm-600">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-warm-300 hover:bg-warm-700 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              Back to Site
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
