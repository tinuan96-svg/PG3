'use client'

import { useEffect } from 'react'
import { purgeStaleCache } from '@/lib/api/client'

// Runs once on mount to clear Supabase-era stale cache entries from localStorage.
export default function CachePurge() {
  useEffect(() => {
    purgeStaleCache()
  }, [])
  return null
}
