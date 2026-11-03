import type { CapacitorConfig } from '@capacitor/cli';

// One product, as with Neverskip Club: the iPhone and iPad apps display the deployed site, so the
// account, the session and every screen are the same as on the web, and a release needs no new
// submission. The "MSTechApp" agent tells the server it is talking to the app (proxy.ts).
// Set CAP_SERVER_URL before `npx cap sync` for another environment.
const url = process.env.CAP_SERVER_URL ?? 'https://ms-tech-orpin.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.mstech.patrimoine',
  appName: 'Kenz',
  webDir: 'ios-shell/www',
  appendUserAgent: 'MSTechApp/1',
  server: {
    url,
    cleartext: url.startsWith('http://'),
    errorPath: 'offline.html',
    // Bank consent pages open inside the app so the callback returns to the session.
    allowNavigation: ['*.biapi.pro', '*.powens.com', '*.leantech.me', '*.saltedge.com', '*.interactivebrokers.com'],
  },
  ios: { contentInset: 'never', scheme: 'Kenz', limitsNavigationsToAppBoundDomains: false },
  plugins: {
    // No backgroundColor: the native view then follows the device's light or dark mode.
    SplashScreen: { launchAutoHide: true, launchShowDuration: 300, showSpinner: false },
    StatusBar: { style: 'DEFAULT', overlaysWebView: true },
    Keyboard: { resize: 'native', resizeOnFullScreen: true, autoBackdropColor: 'auto' },
  },
};

export default config;
