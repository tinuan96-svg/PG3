'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('[AdminGuard] mounted — user:', !!user, 'profile role:', profile?.role, 'loading:', loading)
    return () => console.log('[AdminGuard] unmounted — this should NOT happen during normal admin navigation')
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (profile && profile.role !== 'admin') {
      router.replace('/account')
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#0F2747', borderTopColor: 'transparent' }}
          />
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || profile.role !== 'admin') return null

  return <>{children}</>
}
