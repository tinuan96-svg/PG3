import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function initPushNotifications(userId?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications are only available on native platforms');
    return;
  }

  try {
    await setupNativePush(userId);
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}

async function setupNativePush(userId?: string) {
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.warn('Push notification permissions not granted');
    return;
  }

  await PushNotifications.register();

  // Remove existing listeners before adding new ones to avoid duplicates
  await PushNotifications.removeAllListeners();

  PushNotifications.addListener('registration', async (token: { value: string }) => {
    console.log('Push registration success, token: ' + token.value);
    if (userId) {
      await registerTokenWithBackend(userId, token.value);
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
    // Handle navigation here if needed
  });
}

async function registerTokenWithBackend(userId: string, token: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const platform = Capacitor.getPlatform();

    // We send the token to our Supabase Edge Function to store it
    await fetch(`${SUPABASE_URL}/functions/v1/register-push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ANON_KEY}`,
      },
      body: JSON.stringify({
        user_id: userId,
        token: token,
        platform: platform,
      }),
    });
  } catch (err) {
    console.warn('Failed to register push token with backend', err);
  }
}
