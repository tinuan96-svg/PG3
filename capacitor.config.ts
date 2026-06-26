import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pocketgrocery.app',
  appName: 'PocketGrocery',
  webDir: 'out',

  server: {
    url: 'https://pocketgrocery.com',
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https'
  },

  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    overrideUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 Capacitor'
  },

  android: {
    allowMixedContent: true,
    backgroundColor: '#ffffff',
    overrideUserAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36 Capacitor'
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#ffffff',
      showSpinner: true,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      androidClientId: '75115921613-ic6tp3qu8hr6hheh5i4e4g4i2t1d8p9u.apps.googleusercontent.com',
      iosClientId: '75115921613-placeholder-ios-client-id.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0F2747',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    CapacitorCookies: {
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true,
    }
  }
};

export default config;