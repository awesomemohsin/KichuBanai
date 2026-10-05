'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, isAdmin, user } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const callback = searchParams.get('callbackUrl')
      if (callback) {
        router.replace(callback)
      } else if (isAdmin) {
        router.replace('/admin')
      } else {
        router.replace('/')
      }
    }
  }, [isAuthenticated, isAdmin, user, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!identifier.trim()) {
      setError('Please enter your email or Bangladeshi mobile number')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)
    const result = await login(identifier.trim(), password)
    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to sign in. Please verify your credentials.')
      return
    }

    const callback = searchParams.get('callbackUrl')
    if (callback) {
      window.location.href = callback
      return
    }

    if (result.user?.role === 'admin' || result.user?.role === 'super_admin' || result.user?.role === 'moderator') {
      window.location.href = '/admin'
    } else {
      window.location.href = '/'
    }
  }

  const fillDefaultAdmin = () => {
    setIdentifier('mohsindude5@gmail.com')
    setPassword('admin123456')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <img src="/logo.png" alt="KichuBanai" className="h-12 w-auto object-contain mx-auto" />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-[#1b1a18]">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-[#66635d]">
          Or{' '}
          <Link
            href="/auth/register"
            className="font-semibold text-[#e26f5b] hover:text-[#c45341] transition-colors"
          >
            create a new account for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#e8e4db] rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold uppercase tracking-wider text-[#494743] mb-1.5"
              >
                Email or Mobile Number
              </label>
              <div className="relative rounded-xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9a92]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="name@example.com or 017XXXXXXXX"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full rounded-xl border border-[#ded8cc] pl-10 pr-3 py-2.5 text-sm text-[#1b1a18] placeholder-[#9e9a92] focus:border-[#e26f5b] focus:outline-none focus:ring-2 focus:ring-[#e26f5b]/20 transition-all bg-[#faf9f6]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#494743]"
                >
                  Password
                </label>
              </div>
              <div className="relative rounded-xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9a92]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[#ded8cc] pl-10 pr-10 py-2.5 text-sm text-[#1b1a18] placeholder-[#9e9a92] focus:border-[#e26f5b] focus:outline-none focus:ring-2 focus:ring-[#e26f5b]/20 transition-all bg-[#faf9f6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#9e9a92] hover:text-[#494743] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#1b1a18] hover:bg-[#2c2a27] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b1a18] shadow-sm disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick SuperAdmin Dev Credentials Shortcut */}
          <div className="mt-6 pt-5 border-t border-[#ede9e1]">
            <div className="bg-[#fbf9f5] border border-[#e4ded3] rounded-xl p-3 text-xs text-[#524f4a] flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-[#1b1a18] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#e26f5b]" />
                  <span>Default SuperAdmin Access</span>
                </div>
                <p className="mt-0.5 text-[#736f68]">
                  mohsindude5@gmail.com / admin123456
                </p>
              </div>
              <button
                type="button"
                onClick={fillDefaultAdmin}
                className="text-[11px] font-semibold text-[#e26f5b] hover:underline flex-shrink-0 cursor-pointer pt-0.5"
              >
                Fill credentials
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#736f68]">
          <Link href="/" className="hover:text-[#1b1a18] underline transition-colors">
            ← Back to KichuBanai Studio
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
