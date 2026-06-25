'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sendPhoneOtp, verifyPhoneOtp, signInWithGoogle, signInWithApple } from '@/lib/auth'
import { useAuth } from '@/lib/auth-context'
import { Capacitor } from '@capacitor/core'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const router = useRouter()
  const { user, profile } = useAuth()

  useEffect(() => {
    setIsIOS(Capacitor.getPlatform() === 'ios')
  }, [])

  useEffect(() => {
    if (!user) return
    if (profile?.role === 'admin') router.replace('/admin')
    else router.replace('/account')
  }, [user, profile, router])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { formattedPhone } = await sendPhoneOtp(phone)
      setPhone(formattedPhone)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check the number.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyPhoneOtp(phone, otp)
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.')
      setLoading(false)
    }
  }

  async function handleAppleSignIn() {
    setError('')
    setLoading(true)
    try {
      await signInWithApple()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Apple.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="relative w-14 h-14 overflow-hidden rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100 p-1">
              <img
                src="/logo.png"
                alt="PocketGrocery Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-extrabold" style={{ color: '#0F2747' }}>
              PocketGrocery
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'phone' ? 'Welcome back' : 'Verify OTP'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {step === 'phone'
              ? 'Sign in to your account'
              : `We sent a code to ${phone}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <div className="space-y-6">
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      +44
                    </span>
                    <input
                      type="tel"
                      value={phone.replace('+44', '')}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="7700 000000"
                      className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#5FAE9B] focus:ring-1 focus:ring-[#5FAE9B] transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    We'll send you a one-time password via SMS. Standard rates apply.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: '#0F2747' }}
                >
                  {loading ? 'Sending code…' : 'Send Code'}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </button>

                {(isIOS || Capacitor.isNativePlatform()) && (
                  <button
                    onClick={handleAppleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-black rounded-xl text-sm font-medium text-white hover:bg-gray-900 transition-colors disabled:opacity-60"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.11.8 1.12-.16 2.13-.83 3.69-.73 2.05.14 3.41 1.15 4.14 2.89-4.25 2.1-3.41 7.59.81 9.1-.4 1-.95 1.96-1.75 2.91M12.03 7.25c-.02-2.23 1.84-4.04 3.96-4.25.19 2.41-2.13 4.41-3.96 4.25" />
                    </svg>
                    Apple
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enter 6-digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="123456"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 text-center tracking-[0.5em] font-bold focus:outline-none focus:border-[#5FAE9B] focus:ring-1 focus:ring-[#5FAE9B] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#0F2747' }}
              >
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Change phone number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
