'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { PushProvider } from '@/lib/push-context'
import { initOneSignal, linkUser, unlinkUser } from '@/lib/onesignal'

function OneSignalBridge() {
  const { user } = useAuth()

  useEffect(() => {
    initOneSignal()
  }, [])

  useEffect(() => {
    if (user) {
      linkUser(user.id)
    } else {
      unlinkUser()
    }
  }, [user])

  return null
}

export default function OneSignalInit({ children }: { children: React.ReactNode }) {
  return (
    <PushProvider>
      <OneSignalBridge />
      {children}
    </PushProvider>
  )
}
