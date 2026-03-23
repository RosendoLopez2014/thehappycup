import Link from 'next/link'
import { Header } from '@/components/header'

const FEATURED_DRINKS = [
  {
    id: 'matcha',
    name: 'Matcha Latte',
    description: 'Ceremonial grade matcha with your choice of milk',
    emoji: '🍵',
    gradient: 'from-green-100 to-green-200',
  },
  {
    id: 'energy',
    name: 'Happy Energy',
    description: 'Non-alcoholic energy blend, naturally sweetened',
    emoji: '⚡',
    gradient: 'from-blue-100 to-blue-200',
  },
  {
    id: 'coffee',
    name: 'Cold Brew',
    description: 'Smooth 24-hour cold brew over ice',
    emoji: '☕',
    gradient: 'from-amber-100 to-amber-200',
  },
  {
    id: 'treats',
    name: 'Sweet Treat',
    description: 'Freshly baked goods made daily',
    emoji: '🍪',
    gradient: 'from-orange-100 to-orange-200',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Browse & Customize',
    description: 'Pick your drink, choose your size, adjust the ice — make it yours.',
  },
  {
    step: '02',
    title: 'Choose Pickup or Delivery',
    description: 'Swing by in person or have it brought right to your door.',
  },
  {
    step: '03',
    title: 'Enjoy!',
    description: "Sip, smile, and earn loyalty points with every order.",
  },
]

export default function LandingPage() {
  return (
    <>
      <Header />

      <main className="flex flex-col">
        {/* Hero */}
        <section className="bg-warm-700 text-white py-20 px-4">
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
            <span className="text-5xl select-none">☕</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight max-w-2xl">
              Fresh Drinks, Delivered Happy
            </h1>
            <p className="text-warm-200 text-lg max-w-xl leading-relaxed">
              Non-alcoholic energy drinks, matcha, coffee &amp; treats — made with love and
              delivered to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-warm-700 font-semibold px-6 py-3.5 text-sm hover:bg-warm-100 transition-colors min-h-[44px] w-full sm:w-auto"
              >
                View Menu →
              </Link>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center rounded-xl border border-white/40 text-white font-semibold px-6 py-3.5 text-sm hover:bg-white/10 transition-colors min-h-[44px] w-full sm:w-auto"
              >
                Order Now
              </Link>
            </div>
          </div>
        </section>

        {/* Featured drinks */}
        <section className="py-16 px-4 bg-warm-50" id="about">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-warm-700">What We Make</h2>
              <p className="text-warm-400 text-sm mt-2">
                Hand-crafted drinks and treats, every day.
              </p>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-4 pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              {FEATURED_DRINKS.map((drink) => (
                <Link
                  key={drink.id}
                  href="/menu"
                  className="group rounded-2xl overflow-hidden bg-white border border-warm-200 hover:shadow-md transition-shadow flex flex-col shrink-0 w-44 sm:w-auto"
                >
                  <div
                    className={`h-28 w-full bg-gradient-to-br ${drink.gradient} flex items-center justify-center`}
                  >
                    <span className="text-4xl select-none">{drink.emoji}</span>
                  </div>
                  <div className="p-3 flex flex-col gap-1">
                    <span className="text-sm font-semibold text-warm-600 leading-snug">
                      {drink.name}
                    </span>
                    <span className="text-xs text-warm-400 leading-relaxed line-clamp-2">
                      {drink.description}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex justify-center">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center rounded-xl bg-warm-600 text-white font-semibold px-6 py-3.5 text-sm hover:bg-warm-700 transition-colors min-h-[44px] w-full sm:w-auto"
              >
                See Full Menu →
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-warm-700">How It Works</h2>
              <p className="text-warm-400 text-sm mt-2">Ordering is quick and easy.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map(({ step, title, description }) => (
                <div
                  key={step}
                  className="flex flex-col gap-3 rounded-2xl bg-warm-50 border border-warm-100 p-6"
                >
                  <span className="text-3xl font-bold text-warm-200">{step}</span>
                  <h3 className="font-semibold text-warm-600 text-base">{title}</h3>
                  <p className="text-sm text-warm-400 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Happy Foam™ */}
        <section className="py-16 px-4 bg-warm-50">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
            <span className="text-4xl select-none">✨</span>
            <h2 className="font-display text-2xl font-bold text-warm-700">Meet Happy Foam™</h2>
            <p className="text-warm-500 text-base leading-relaxed max-w-lg">
              Our signature creamy topping that turns every drink into something special.
              Light, smooth, and made to elevate every sip.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              <span className="rounded-full bg-white border border-warm-200 px-4 py-2 text-sm font-medium text-warm-600">
                Vanilla
              </span>
              <span className="rounded-full bg-white border border-warm-200 px-4 py-2 text-sm font-medium text-warm-600">
                Blueberry
              </span>
              <span className="rounded-full bg-white border border-warm-200 px-4 py-2 text-sm font-medium text-warm-600">
                Strawberry
              </span>
            </div>
            <p className="text-warm-400 text-xs italic">
              Available on any drink — just tap &quot;+ Happy Foam™&quot; when you order
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center rounded-xl bg-warm-600 text-white font-semibold px-6 py-3.5 text-sm hover:bg-warm-700 transition-colors min-h-[44px] mt-2"
            >
              Make it Happy →
            </Link>
          </div>
        </section>

        {/* Info section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white border border-warm-200 p-6 flex flex-col gap-3">
              <span className="text-3xl select-none">🚗</span>
              <h3 className="font-semibold text-warm-600 text-base">Pickup &amp; Delivery</h3>
              <p className="text-sm text-warm-400 leading-relaxed">
                Order ahead for convenient pickup, or choose delivery and we'll bring
                your drinks straight to you.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-warm-200 p-6 flex flex-col gap-3">
              <span className="text-3xl select-none">✦</span>
              <h3 className="font-semibold text-warm-600 text-base">Loyalty Points</h3>
              <p className="text-sm text-warm-400 leading-relaxed">
                Earn points with every order and redeem them for free drinks. The more
                you sip, the more you save.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-warm-700 text-warm-200 py-10 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <span className="font-display font-semibold text-white text-base">The Happy Cup</span>
              <span className="text-xs text-warm-300 italic">sip. smile. repeat.</span>
            </div>
            <nav className="flex gap-5 text-sm">
              <Link href="/#about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/menu" className="hover:text-white transition-colors">
                Menu
              </Link>
              <Link href="/menu" className="hover:text-white transition-colors">
                Order
              </Link>
              <Link href="/cart" className="hover:text-white transition-colors">
                Cart
              </Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  )
}
