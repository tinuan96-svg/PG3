'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, profile } = useAuth()

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      router.replace('/admin')
    }
  }, [user, profile, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user: signedInUser } = await signIn(email, password)
      if (!signedInUser) throw new Error('Login failed')
      // Role check is handled by AdminGuard once the auth context loads the profile.
      // Redirect to /admin and let AdminGuard enforce access.
      router.replace('/admin')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#0F2747' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="relative w-16 h-16 overflow-hidden rounded-xl">
              <img
                src="/logo.png"
                alt="PocketGrocery Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <p className="text-white font-extrabold text-xl">PocketGrocery</p>
              <p className="text-xs font-medium" style={{ color: '#5FAE9B' }}>Admin Portal</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Administrator Sign In</h1>
          <p className="text-gray-400 mt-1 text-sm">Access restricted to authorised personnel only</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@pocketgrocery.co.uk"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#5FAE9B] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#5FAE9B] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60 mt-2"
              style={{ backgroundColor: '#5FAE9B', color: '#0F2747' }}
            >
              {loading ? 'Verifying…' : 'Sign in to Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Not an admin?{' '}
          <a href="/login" className="text-gray-400 hover:text-white transition-colors underline">
            Customer sign in
          </a>
        </p>
      </div>
    </div>
  )
}
