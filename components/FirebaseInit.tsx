'use client'

import { useEffect } from 'react'
import { initAnalytics } from '@/lib/firebase'
import { initFCM } from '@/lib/fcm'
import { useAuth } from '@/lib/auth-context'

export default function FirebaseInit() {
  const { user } = useAuth()

  useEffect(() => {
    initAnalytics().catch(console.error)
  }, [])

  useEffect(() => {
    // Only initialize FCM if we have a user (to link the token)
    // or you can initialize it without a user for guest notifications
    initFCM(user?.id).catch(console.error)
  }, [user])

  return null
}
