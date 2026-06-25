'use client'

import { createContext, useContext, useRef, useCallback } from 'react'
import { requestPermission, registerDevice } from './onesignal'
import { supabase } from './supabase'

interface PushContextValue {
  triggerPermission: (userId: string) => Promise<void>
}

export const PushContext = createContext<PushContextValue>({
  triggerPermission: async () => {},
})

export function usePush() {
  return useContext(PushContext)
}

const PROMPTED_KEY = 'pg_push_prompted'

export function PushProvider({ children }: { children: React.ReactNode }) {
  const pendingRef = useRef(false)

  const triggerPermission = useCallback(async (userId: string) => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(PROMPTED_KEY)) return
    if (pendingRef.current) return

    pendingRef.current = true
    sessionStorage.setItem(PROMPTED_KEY, '1')

    try {
      const granted = await requestPermission()
      if (granted) {
        const { data: { session } } = await supabase.auth.getSession()
        await registerDevice(userId, session?.access_token)
      }
    } catch {
      // non-fatal
    } finally {
      pendingRef.current = false
    }
  }, [])

  return (
    <PushContext.Provider value={{ triggerPermission }}>
      {children}
    </PushContext.Provider>
  )
}
