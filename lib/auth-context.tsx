'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { addCoins } from './wallet'

export type Profile = {
  id: string
  name: string
  email: string
  role: 'customer' | 'admin'
  phone: string
  address: string
  city: string
  postcode: string
  referral_code: string | null
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

// Maps a user_profiles DB row (profile_role column) to the Profile shape the app uses
function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    name: (row.name as string) ?? (row.full_name as string) ?? '',
    email: (row.email as string) ?? '',
    role: ((row.role as string) === 'admin' ? 'admin' : 'customer') as 'customer' | 'admin',
    phone: (row.phone as string) ?? '',
    address: (row.address as string) ?? '',
    city: (row.city as string) ?? '',
    postcode: (row.postcode as string) ?? '',
    referral_code: (row.referral_code as string) ?? null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchOrCreateProfile(userId: string, userEmail?: string) {
    // Use SECURITY DEFINER RPC to avoid RLS timing issues right after sign-in
    const { data } = await supabase.rpc('get_my_profile')
    const row = Array.isArray(data) ? data[0] : data

    if (row) {
      setProfile(rowToProfile(row as Record<string, unknown>))
      return
    }

    // First login for a new user — create their profile and wallet
    const { data: newProfile } = await supabase.from('user_profiles')
      .insert({
        auth_user_id: userId,
        email: userEmail ?? '',
        full_name: '',
        role: 'customer',
      })
      .select()
      .maybeSingle()

    await supabase
      .from('wallets')
      .insert({ user_id: userId, balance: 0 })
      .select()
      .maybeSingle()

    if (newProfile) setProfile(rowToProfile(newProfile as Record<string, unknown>))

    // Check and award daily login bonus
    await awardDailyBonus(userId)
  }

  async function awardDailyBonus(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: existingBonus } = await supabase
        .from('wallet_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'bonus')
        .gte('created_at', today)
        .maybeSingle()

      if (!existingBonus) {
        await addCoins(
          userId,
          5,
          'bonus',
          `Daily login bonus - ${new Date().toLocaleDateString('en-GB')}`
        )
        console.log('[auth] Daily login bonus awarded')
      }
    } catch (err) {
      console.error('[auth] Failed to award daily bonus:', err)
    }
  }

  async function refreshProfile() {
    if (user) await fetchOrCreateProfile(user.id, user.email)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION synchronously on mount, so we
    // don't also call getSession — that would kick off two concurrent
    // fetchOrCreateProfile calls and cause a double re-render on every page load.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setLoading(false)
        return
      }

      // TOKEN_REFRESHED fires ~every hour. The user and profile haven't changed —
      // calling fetchOrCreateProfile here would create a new profile object reference
      // every hour, triggering re-renders across every admin page and causing
      // AdminGuard to briefly unmount its children (input focus loss).
      if (event === 'TOKEN_REFRESHED') {
        console.log('[auth] token refreshed — skipping profile re-fetch')
        setLoading(false)
        return
      }

      // INITIAL_SESSION, SIGNED_IN, USER_UPDATED → fetch/create profile
      if (currentUser) {
        (async () => {
          console.log('[auth] fetching profile for event:', event)
          await fetchOrCreateProfile(currentUser.id, currentUser.email)
          setLoading(false)
        })()
      } else {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
