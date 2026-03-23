'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-warm-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-warm-200 rounded-2xl shadow-sm p-8">
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

        <h1 className="text-xl font-semibold text-warm-800 text-center mb-6">Log in</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-warm-700 text-sm">
              Email
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
            <Label htmlFor="password" className="text-warm-700 text-sm">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            className="w-full bg-warm-600 hover:bg-warm-700 text-white mt-2"
          >
            {loading ? 'Logging in…' : 'Log In'}
          </Button>
        </form>

        <p className="text-sm text-warm-500 text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-warm-700 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
