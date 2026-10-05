'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, Lock, Mail, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

function RegisterForm() {
  const router = useRouter()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter your full name')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service to create an account')
      return
    }

    setIsLoading(true)
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim() || undefined,
      password,
    })
    setIsLoading(false)

    if (!result.success) {
      setError(result.error || 'Failed to create account. Please try again.')
      return
    }

    // Success -> redirect to studio
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <img src="/logo.png" alt="KichuBanai" className="h-12 w-auto object-contain mx-auto" />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-[#1b1a18]">
          Create your KichuBanai account
        </h2>
        <p className="mt-1 text-sm text-[#66635d]">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-[#e26f5b] hover:text-[#c45341] transition-colors"
          >
            Sign in here
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#494743] mb-1.5"
              >
                Full Name
              </label>
              <div className="relative rounded-xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9a92]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-[#ded8cc] pl-10 pr-3 py-2.5 text-sm text-[#1b1a18] placeholder-[#9e9a92] focus:border-[#e26f5b] focus:outline-none focus:ring-2 focus:ring-[#e26f5b]/20 transition-all bg-[#faf9f6]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#494743] mb-1.5"
              >
                Email Address
              </label>
              <div className="relative rounded-xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9a92]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-[#ded8cc] pl-10 pr-3 py-2.5 text-sm text-[#1b1a18] placeholder-[#9e9a92] focus:border-[#e26f5b] focus:outline-none focus:ring-2 focus:ring-[#e26f5b]/20 transition-all bg-[#faf9f6]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="mobile"
                className="block text-xs font-semibold uppercase tracking-wider text-[#494743] mb-1.5"
              >
                Mobile Number <span className="text-[#9e9a92] font-normal lowercase">(Optional)</span>
              </label>
              <div className="relative rounded-xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9a92]">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="mobile"
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="block w-full rounded-xl border border-[#ded8cc] pl-10 pr-3 py-2.5 text-sm text-[#1b1a18] placeholder-[#9e9a92] focus:border-[#e26f5b] focus:outline-none focus:ring-2 focus:ring-[#e26f5b]/20 transition-all bg-[#faf9f6]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#494743] mb-1.5"
              >
                Password <span className="text-[#9e9a92] font-normal lowercase">(min 6 characters)</span>
              </label>
              <div className="relative rounded-xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9a92]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
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
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold uppercase tracking-wider text-[#494743] mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative rounded-xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9e9a92]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-[#ded8cc] pl-10 pr-3 py-2.5 text-sm text-[#1b1a18] placeholder-[#9e9a92] focus:border-[#e26f5b] focus:outline-none focus:ring-2 focus:ring-[#e26f5b]/20 transition-all bg-[#faf9f6]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-4 w-4 rounded border-[#ded8cc] text-[#e26f5b] focus:ring-[#e26f5b]"
              />
              <label htmlFor="terms" className="text-xs text-[#66635d]">
                I agree to the Terms of Service & Privacy Policy
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#1b1a18] hover:bg-[#2c2a27] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1b1a18] shadow-sm disabled:opacity-50 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
