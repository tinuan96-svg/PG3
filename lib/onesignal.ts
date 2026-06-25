import { Capacitor } from '@capacitor/core';
import OneSignalNative from 'onesignal-capacitor-plugin';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '65e4f18a-f093-442c-90d1-861ee5570c93'

function getWebSDK(): any | null {
  if (typeof window === 'undefined') return null
  return (window as any).OneSignal ?? null
}

export async function initOneSignal(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      OneSignalNative.initialize(APP_ID);
      // Optional: Add listeners here
      // OneSignalNative.Notifications.addEventListener('click', (event) => { ... });
    } catch (e) {
      console.error('OneSignal Native init failed', e);
    }
  } else {
    const os = getWebSDK()
    if (!os || !APP_ID) return
    try {
      await os.init({
        appId: APP_ID,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerParam: { scope: '/' },
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
        notifyButton: { enable: false },
      })
    } catch {
      // Non-fatal
    }
  }
}

export async function linkUser(userId: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try { OneSignalNative.login(userId) } catch {}
  } else {
    const os = getWebSDK()
    if (!os) return
    try { await os.login(userId) } catch {}
  }
}

export async function unlinkUser(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try { OneSignalNative.logout() } catch {}
  } else {
    const os = getWebSDK()
    if (!os) return
    try { await os.logout() } catch {}
  }
}

export async function requestPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      return await OneSignalNative.Notifications.requestPermission(true);
    } catch {
      return false
    }
  } else {
    const os = getWebSDK()
    if (!os) return false
    try {
      await os.Notifications.requestPermission()
      return os.Notifications.permission === true
    } catch {
      return false
    }
  }
}

export function isPermissionGranted(): boolean {
  if (Capacitor.isNativePlatform()) {
    return false // Native usually requires async check or listener
  } else {
    const os = getWebSDK()
    if (!os) return false
    return os.Notifications?.permission === true
  }
}

export async function setTags(tags: Record<string, any>): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try { OneSignalNative.User.addTags(tags) } catch {}
  } else {
    const os = getWebSDK()
    if (!os) return
    try { await os.User.addTags(tags) } catch {}
  }
}

export async function getPlayerId(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const id = await OneSignalNative.User.getOnesignalId();
      return id ?? null;
    } catch {
      return null
    }
  } else {
    const os = getWebSDK()
    if (!os) return null
    try { return (await os.User?.PushSubscription?.id) ?? null } catch { return null }
  }
}

export async function registerDevice(userId: string, bearerToken?: string): Promise<void> {
  try {
    const playerId = await getPlayerId()
    if (!playerId) return

    await fetch(`${SUPABASE_URL}/functions/v1/onesignal-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken || ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'register',
        user_id: userId,
        player_id: playerId,
        device_type: Capacitor.isNativePlatform() ? (Capacitor.getPlatform() === 'ios' ? 'ios' : 'android') : 'web',
        platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : detectPlatform(),
      }),
    })
  } catch (err) {
    console.warn('Failed to register device with backend', err)
  }
}

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'web'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('edg/')) return 'edge'
  if (ua.includes('chrome')) return 'chrome'
  if (ua.includes('firefox')) return 'firefox'
  if (ua.includes('safari')) return 'safari'
  return 'web'
}
