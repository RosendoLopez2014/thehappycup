import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'

const MENU_CATEGORIES = [
  {
    id: 'matcha',
    name: 'Matcha',
    tagline: 'Ceremonial grade, creamy, vibrant',
    accent: 'bg-[#4a6741]',
    accentLight: 'bg-[#4a6741]/10',
    textAccent: 'text-[#4a6741]',
  },
  {
    id: 'energy',
    name: 'Energy',
    tagline: 'Clean energy, naturally sweetened',
    accent: 'bg-[#2d5a7b]',
    accentLight: 'bg-[#2d5a7b]/10',
    textAccent: 'text-[#2d5a7b]',
  },
  {
    id: 'coffee',
    name: 'Cold Brew',
    tagline: 'Smooth 24-hour steep, over ice',
    accent: 'bg-warm-600',
    accentLight: 'bg-warm-600/10',
    textAccent: 'text-warm-600',
  },
  {
    id: 'treats',
    name: 'Treats',
    tagline: 'Freshly baked, made daily',
    accent: 'bg-[#b5651d]',
    accentLight: 'bg-[#b5651d]/10',
    textAccent: 'text-[#b5651d]',
  },
]

export default function LandingPage() {
  return (
    <>
      <Header />

      <main className="flex flex-col">
        {/* ── Hero ── */}
        <section className="relative bg-warm-700 text-white overflow-hidden noise-overlay">
          <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[85vh] lg:min-h-[90vh]">
            {/* Left — Copy */}
            <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-16 lg:py-24 order-2 lg:order-1">
              <p className="animate-fade-up text-warm-300 text-xs font-semibold tracking-[0.2em] uppercase mb-6">
                Non-alcoholic · Made with love · Delivered fresh
              </p>

              <h1 className="animate-fade-up delay-100 font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] mb-6">
                Drinks That<br />
                <span className="text-warm-300">Make You</span><br />
                Smile
              </h1>

              <p className="animate-fade-up delay-200 text-warm-200/80 text-base sm:text-lg max-w-md leading-relaxed mb-10">
                Matcha, energy drinks, cold brew &amp; baked goods — crafted daily
                and delivered to your&nbsp;door.
              </p>

              <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-warm-700 font-semibold px-8 py-4 text-sm tracking-wide hover:bg-warm-100 transition-all min-h-[48px] w-full sm:w-auto"
                >
                  Order Now
                </Link>
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 text-white font-medium px-8 py-4 text-sm tracking-wide hover:bg-white/10 hover:border-white/50 transition-all min-h-[48px] w-full sm:w-auto"
                >
                  Explore Menu
                </Link>
              </div>

              {/* Trust signals */}
              <div className="animate-fade-up delay-500 flex items-center gap-6 mt-12 pt-8 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="font-display text-2xl font-bold text-white">Fresh</span>
                  <span className="text-warm-300/70 text-xs tracking-wide">Made daily</span>
                </div>
                <div className="w-px h-8 bg-white/15" />
                <div className="flex flex-col">
                  <span className="font-display text-2xl font-bold text-white">Clean</span>
                  <span className="text-warm-300/70 text-xs tracking-wide">No alcohol</span>
                </div>
                <div className="w-px h-8 bg-white/15" />
                <div className="flex flex-col">
                  <span className="font-display text-2xl font-bold text-white">Fast</span>
                  <span className="text-warm-300/70 text-xs tracking-wide">Pickup &amp; delivery</span>
                </div>
              </div>
            </div>

            {/* Right — Image */}
            <div className="relative order-1 lg:order-2 min-h-[50vh] lg:min-h-0">
              <div className="animate-scale-in delay-200 absolute inset-0">
                <Image
                  src="/drinks/thc.png"
                  alt="The Happy Cup signature drinks"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Gradient overlay for text readability on mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-warm-700 via-warm-700/30 to-transparent lg:bg-gradient-to-r lg:from-warm-700/60 lg:via-transparent lg:to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* ── What We Make ── */}
        <section className="py-20 sm:py-28 px-6" id="about">
          <div className="max-w-6xl mx-auto">
            <div className="animate-fade-up flex flex-col items-center text-center mb-14">
              <p className="text-warm-400 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                The Menu
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-warm-700">
                What We Make
              </h2>
              <div className="divider-dot" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {MENU_CATEGORIES.map((cat, i) => (
                <Link
                  key={cat.id}
                  href="/menu"
                  className={`animate-fade-up delay-${(i + 1) * 100} group relative rounded-2xl overflow-hidden border border-warm-200/60 bg-white p-6 sm:p-8 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                >
                  {/* Category accent dot */}
                  <div className={`w-3 h-3 rounded-full ${cat.accent}`} />

                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-display text-xl font-bold text-warm-700 group-hover:text-warm-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-warm-400 leading-relaxed">
                      {cat.tagline}
                    </p>
                  </div>

                  {/* Hover arrow */}
                  <span className={`${cat.textAccent} text-sm font-medium mt-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}>
                    Browse &rarr;
                  </span>

                  {/* Background accent on hover */}
                  <div className={`absolute inset-0 ${cat.accentLight} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} />
                </Link>
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center rounded-full bg-warm-700 text-white font-semibold px-8 py-4 text-sm tracking-wide hover:bg-warm-600 transition-colors min-h-[48px]"
              >
                See Full Menu
              </Link>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="relative py-20 sm:py-28 px-6 bg-warm-700 text-white noise-overlay overflow-hidden">
          <div className="relative z-10 max-w-6xl mx-auto">
            <div className="animate-fade-up flex flex-col items-center text-center mb-16">
              <p className="text-warm-300/70 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                Simple &amp; Fast
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                How It Works
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
              {[
                {
                  step: '01',
                  title: 'Browse & Customize',
                  desc: 'Pick your drink, choose your size, adjust the ice — make it yours.',
                },
                {
                  step: '02',
                  title: 'Pickup or Delivery',
                  desc: 'Swing by in person or have it brought right to your door.',
                },
                {
                  step: '03',
                  title: 'Sip & Enjoy',
                  desc: 'Every order earns loyalty points toward free drinks.',
                },
              ].map(({ step, title, desc }, i) => (
                <div
                  key={step}
                  className={`animate-fade-up delay-${(i + 1) * 200} relative flex flex-col items-center text-center gap-4`}
                >
                  <span className="font-display text-6xl sm:text-7xl font-bold text-white/10 leading-none">
                    {step}
                  </span>
                  <h3 className="font-semibold text-white text-lg -mt-2">
                    {title}
                  </h3>
                  <p className="text-warm-200/70 text-sm leading-relaxed max-w-xs">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Happy Foam™ ── */}
        <section className="relative py-20 sm:py-28 px-6 overflow-hidden">
          {/* Subtle warm gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-warm-50 via-white to-warm-100" />

          <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Visual */}
            <div className="animate-scale-in flex items-center justify-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                {/* Decorative rings */}
                <div className="absolute inset-0 rounded-full border-2 border-warm-200/50 animate-[spin_40s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-warm-200/30 animate-[spin_60s_linear_infinite_reverse]" />
                <div className="absolute inset-8 rounded-full bg-warm-100/60 flex items-center justify-center">
                  <div className="text-center px-6">
                    <p className="font-display text-3xl sm:text-4xl font-bold text-warm-700 leading-tight">
                      Happy<br />Foam™
                    </p>
                    <p className="text-warm-400 text-xs mt-2 tracking-wide">
                      Our signature topping
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Copy */}
            <div className="animate-fade-up flex flex-col gap-6">
              <p className="text-warm-400 text-xs font-semibold tracking-[0.2em] uppercase">
                Something Special
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-warm-700 leading-tight">
                Every Drink Deserves<br />
                <span className="text-warm-400">A Little Extra</span>
              </h2>
              <p className="text-warm-500 text-base leading-relaxed max-w-lg">
                Our signature creamy topping that turns every drink into something
                special. Light, smooth, and made to elevate every&nbsp;sip.
              </p>

              {/* Flavor chips */}
              <div className="flex flex-wrap gap-2">
                {['Vanilla', 'Blueberry', 'Strawberry'].map((flavor) => (
                  <span
                    key={flavor}
                    className="rounded-full bg-warm-700 text-white px-5 py-2.5 text-sm font-medium tracking-wide"
                  >
                    {flavor}
                  </span>
                ))}
              </div>

              <p className="text-warm-400 text-xs italic">
                Available on any drink — just tap &quot;+ Happy Foam™&quot; when you order
              </p>

              <div>
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center rounded-full bg-warm-700 text-white font-semibold px-8 py-4 text-sm tracking-wide hover:bg-warm-600 transition-colors min-h-[48px]"
                >
                  Make It Happy
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pickup & Loyalty split ── */}
        <section className="px-6 py-20 sm:py-28 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pickup & Delivery */}
            <div className="animate-fade-up relative group rounded-3xl bg-warm-700 text-white p-8 sm:p-12 flex flex-col gap-4 overflow-hidden noise-overlay">
              <div className="relative z-10">
                <p className="text-warm-300/70 text-xs font-semibold tracking-[0.2em] uppercase mb-2">
                  Convenience
                </p>
                <h3 className="font-display text-2xl sm:text-3xl font-bold leading-tight mb-3">
                  Pickup &amp;<br />Delivery
                </h3>
                <p className="text-warm-200/70 text-sm leading-relaxed max-w-sm mb-6">
                  Order ahead for convenient pickup, or choose delivery and we&apos;ll
                  bring your drinks straight to&nbsp;you.
                </p>
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 text-white font-medium px-6 py-3 text-sm tracking-wide hover:bg-white/10 hover:border-white/50 transition-all min-h-[44px]"
                >
                  Start an Order &rarr;
                </Link>
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="animate-fade-up delay-200 relative group rounded-3xl bg-warm-50 border border-warm-200/60 p-8 sm:p-12 flex flex-col gap-4 overflow-hidden">
              <p className="text-warm-400 text-xs font-semibold tracking-[0.2em] uppercase mb-2">
                Rewards
              </p>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-warm-700 leading-tight mb-3">
                Earn Points,<br />
                <span className="text-warm-400">Sip Free</span>
              </h3>
              <p className="text-warm-500 text-sm leading-relaxed max-w-sm mb-6">
                Every order earns points. Redeem them for free drinks, treats,
                and more. The more you sip, the more you&nbsp;save.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-full bg-warm-700 text-white font-semibold px-6 py-3 text-sm tracking-wide hover:bg-warm-600 transition-colors min-h-[44px]"
              >
                Join for Free &rarr;
              </Link>

              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-warm-200/30" />
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative bg-warm-700 text-warm-200 py-14 sm:py-20 px-6 noise-overlay overflow-hidden">
          <div className="relative z-10 max-w-6xl mx-auto">
            {/* Top section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 mb-12 pb-10 border-b border-white/10">
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
                  The Happy Cup
                </h2>
                <p className="text-warm-300/60 text-sm italic tracking-wide">
                  sip. smile. repeat.
                </p>
              </div>
              <Link
                href="/menu"
                className="inline-flex items-center justify-center rounded-full bg-white text-warm-700 font-semibold px-8 py-4 text-sm tracking-wide hover:bg-warm-100 transition-colors min-h-[48px]"
              >
                Order Now
              </Link>
            </div>

            {/* Bottom section */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <nav className="flex flex-wrap justify-center sm:justify-start gap-x-8 gap-y-2 text-sm">
                <Link href="/#about" className="text-warm-300/70 hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/menu" className="text-warm-300/70 hover:text-white transition-colors">
                  Menu
                </Link>
                <Link href="/menu" className="text-warm-300/70 hover:text-white transition-colors">
                  Order
                </Link>
                <Link href="/cart" className="text-warm-300/70 hover:text-white transition-colors">
                  Cart
                </Link>
              </nav>
              <p className="text-warm-300/40 text-xs">
                &copy; {new Date().getFullYear()} The Happy Cup. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
