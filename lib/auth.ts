import { supabase } from './supabase'
import { Capacitor } from '@capacitor/core'

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) throw error
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function sendPhoneOtp(phone: string) {
  // Normalize UK phone numbers if not already prefixed
  const formattedPhone = phone.startsWith('+')
    ? phone
    : `+44${phone.startsWith('0') ? phone.slice(1) : phone}`

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  })
  if (error) throw error
  return { data, formattedPhone }
}

export async function verifyPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: Capacitor.isNativePlatform()
        ? 'com.pocketgrocery.app://auth/callback'
        : `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: Capacitor.isNativePlatform()
        ? 'com.pocketgrocery.app://auth/callback'
        : `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/account/profile?update-password=1`,
  })
  if (error) throw error
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getUserRole(userId: string): Promise<'customer' | 'admin' | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('auth_user_id', userId)
    .maybeSingle()
  return ((data as Record<string, unknown> | null)?.role as 'customer' | 'admin') ?? null
}
