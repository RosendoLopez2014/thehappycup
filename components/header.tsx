'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Menu, User, LogOut } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useCart } from '@/components/cart-provider'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Customer {
  id: string
  name: string
  email: string
  points_balance: number
}

export function Header() {
  const { itemCount } = useCart()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser)
      if (currentUser) {
        supabase
          .from('customers')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()
          .then(({ data }) => setCustomer(data))
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        supabase
          .from('customers')
          .select('*')
          .eq('user_id', sessionUser.id)
          .single()
          .then(({ data }) => setCustomer(data))
      } else {
        setCustomer(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  const isAdmin = user?.app_metadata?.role === 'admin'
  const initial = customer?.name?.charAt(0).toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? '?'

  const authDesktop = user ? (
    <div className="flex items-center gap-3">
      {/* Admin link */}
      {isAdmin && (
        <Link
          href="/admin"
          className="text-xs font-semibold text-white bg-warm-600 px-2.5 py-1 rounded-full hover:bg-warm-700 transition-colors"
        >
          Admin
        </Link>
      )}
      {/* Points badge */}
      {customer && (
        <span className="text-xs font-medium text-warm-600 bg-warm-100 px-2.5 py-1 rounded-full">
          ✦ {customer.points_balance ?? 0} pts
        </span>
      )}
      {/* Profile link */}
      <Link
        href="/profile"
        className="flex items-center gap-1.5 text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors"
        aria-label="Your profile"
      >
        <span className="w-7 h-7 rounded-full bg-warm-200 text-warm-700 text-xs font-bold flex items-center justify-center">
          {initial}
        </span>
      </Link>
      {/* Log out */}
      <button
        onClick={handleSignOut}
        className="text-warm-400 hover:text-warm-600 transition-colors"
        aria-label="Log out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <Link
      href="/auth/login"
      className="text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors"
    >
      Log In
    </Link>
  )

  const authMobile = user ? (
    <div className="flex flex-col gap-3 border-t border-warm-100 pt-4 mt-2">
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-2 text-sm font-semibold text-white bg-warm-600 px-3 py-1.5 rounded-lg hover:bg-warm-700 transition-colors self-start"
        >
          Admin Dashboard
        </Link>
      )}
      {customer && (
        <span className="text-xs font-medium text-warm-600 bg-warm-100 px-2.5 py-1 rounded-full self-start">
          ✦ {customer.points_balance ?? 0} pts
        </span>
      )}
      <Link
        href="/profile"
        className="flex items-center gap-2 text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors"
      >
        <User className="w-4 h-4" />
        Profile
      </Link>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 text-sm font-medium text-warm-400 hover:text-warm-600 transition-colors text-left"
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-3 border-t border-warm-100 pt-4 mt-2">
      <Link
        href="/auth/login"
        className="text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors"
      >
        Log In
      </Link>
      <Link
        href="/auth/signup"
        className="text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors"
      >
        Sign Up
      </Link>
    </div>
  )

  const navLinks = (
    <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <Link
        href="/menu"
        className="text-sm font-medium text-warm-600 hover:text-warm-700 transition-colors"
      >
        Menu
      </Link>
    </nav>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-warm-200">
      <div className="max-w-5xl mx-auto px-3 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0 -my-1">
          <Image
            src="/logo/header/header-logo.png"
            alt="The Happy Cup"
            width={400}
            height={80}
            priority
            className="object-contain h-14 sm:h-16 w-auto max-w-[200px] sm:max-w-[260px]"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks}

          {/* Auth */}
          {authDesktop}

          {/* Cart */}
          <Link href="/cart" className="relative" aria-label="Cart">
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
          <Link href="/cart" className="relative" aria-label="Cart">
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
              {authMobile}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
