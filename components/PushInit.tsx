'use client'

import { useEffect } from 'react'
import { initPushNotifications } from '@/lib/push-notifications'
import { useAuth } from '@/lib/auth-context'
import { Capacitor } from '@capacitor/core'

export default function PushInit() {
  const { user } = useAuth()

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Initialize push notifications
      // We can pass user ID if logged in to link the token
      initPushNotifications(user?.id).catch(console.error)
    }
  }, [user?.id])

  return null
}
