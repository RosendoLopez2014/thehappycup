'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingBag, Menu } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export function Header() {
  const { itemCount } = useCart()

  const navLinks = (
    <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <Link
        href="/"
        className="text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors"
      >
        Menu
      </Link>
    </nav>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-warm-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/logo/1x/logo.png"
            alt="The Happy Cup logo"
            width={40}
            height={40}
            priority
            className="rounded-full object-cover"
          />
          <span className="font-semibold text-warm-600 text-base leading-tight">
            The Happy Cup
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks}

          {/* Cart */}
          <Link href="/cart" className="relative">
            <ShoppingBag className="w-5 h-5 text-warm-600" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-warm-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex items-center gap-3 sm:hidden">
          <Link href="/cart" className="relative">
            <ShoppingBag className="w-5 h-5 text-warm-600" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-warm-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="text-warm-600 hover:bg-warm-100" />
              }
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-white pt-10">
              {navLinks}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
