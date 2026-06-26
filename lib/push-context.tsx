'use client'

import { createContext, useContext, useCallback } from 'react'

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
    // OneSignal removed
  }, [])

  return (
    <PushContext.Provider value={{ triggerPermission }}>
      {children}
    </PushContext.Provider>
  )
}
