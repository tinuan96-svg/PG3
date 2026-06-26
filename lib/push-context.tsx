'use client'

import { createContext, useContext, useCallback } from 'react'

import { initPushNotifications } from './push-notifications'

interface PushContextValue {
  triggerPermission: (userId: string) => Promise<void>
}

export const PushContext = createContext<PushContextValue>({
  triggerPermission: async () => {},
})

export function usePush() {
  return useContext(PushContext)
}

export function PushProvider({ children }: { children: React.ReactNode }) {
  const triggerPermission = useCallback(async (userId: string) => {
    await initPushNotifications(userId)
  }, [])

  return (
    <PushContext.Provider value={{ triggerPermission }}>
      {children}
    </PushContext.Provider>
  )
}
