import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';
import { supabase } from './supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY // You'll need this for web

export async function initFCM(userId?: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await setupNativePush(userId);
  } else {
    await setupWebPush(userId);
  }
}

async function setupNativePush(userId?: string) {
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    throw new Error('User denied permissions!');
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token: { value: string }) => {
    console.log('Push registration success, token: ' + token.value);

    // On iOS, this 'token' is usually the APNS token.
    // Firebase can send to APNS tokens if the APNS key is uploaded to Firebase Console.
    if (userId) {
      await registerTokenWithBackend(userId, token.value, Capacitor.getPlatform() === 'ios' ? 'apns' : 'fcm');
    }
  });

  PushNotifications.addListener('registrationError', (error: any) => {
    console.error('Error on registration: ' + JSON.stringify(error));
  });

  PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
    console.log('Push received: ' + JSON.stringify(notification));
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
    console.log('Push action performed: ' + JSON.stringify(notification));
  });
}

async function setupWebPush(userId?: string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });

    if (token) {
      console.log('Web Push token:', token);
      if (userId) {
        await registerTokenWithBackend(userId, token, 'web');
      }
    }

    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // Handle foreground message
    });
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
  }
}

async function registerTokenWithBackend(userId: string, token: string, type: 'web' | 'fcm' | 'apns') {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    await fetch(`${SUPABASE_URL}/functions/v1/register-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        token: token,
        platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
        type: type
      }),
    });
  } catch (err) {
    console.warn('Failed to register FCM token with backend', err);
  }
}
