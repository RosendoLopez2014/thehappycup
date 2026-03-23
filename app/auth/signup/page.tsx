'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Client-side validation
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const user = data.user

    if (user) {
      // Insert customer record (RLS allows insert when auth.uid() = user_id)
      const { error: insertError } = await supabase.from('customers').insert({
        user_id: user.id,
        name: name.trim(),
        email,
        phone: phone.trim() || null,
      })

      if (insertError) {
        // Non-fatal: auth account was created; log and continue
        console.error('Customer insert error:', insertError.message)
      }

      if (data.session) {
        // Email confirmation not required — user is fully logged in
        router.push('/')
        router.refresh()
      } else {
        // Email confirmation required
        setSuccess('Account created! Check your email to verify before logging in.')
        setLoading(false)
      }
    } else {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-warm-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white border border-warm-200 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/logo/1x/logo.png"
            alt="The Happy Cup logo"
            width={56}
            height={56}
            priority
            className="rounded-full object-cover"
          />
          <span className="font-semibold text-warm-700 text-lg">The Happy Cup</span>
        </div>

        <h1 className="font-display text-xl font-semibold text-warm-800 text-center mb-6">Create account</h1>

        {success ? (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-center">
            {success}
            <p className="mt-3">
              <Link href="/auth/login" className="text-warm-700 font-medium hover:underline">
                Go to Log In
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-warm-700 text-sm">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-warm-700 text-sm">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone" className="text-warm-700 text-sm">
                Phone <span className="text-warm-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-warm-700 text-sm">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-warm-700 text-sm">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="border-warm-200 focus-visible:ring-warm-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-warm-600 hover:bg-warm-700 text-white mt-2 min-h-[48px] text-base"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
        )}

        {!success && (
          <p className="text-sm text-warm-500 text-center mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-warm-700 font-medium hover:underline">
              Log in
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
