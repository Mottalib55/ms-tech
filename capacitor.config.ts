import type { CapacitorConfig } from '@capacitor/cli';

// The app loads the deployed site, so the API and the session cookie stay
// same-origin. Set CAP_SERVER_URL before `npx cap sync` for another environment.
const url = process.env.CAP_SERVER_URL ?? 'https://ms-tech-orpin.vercel.app';

const config: CapacitorConfig = {
  appId: 'com.mstech.patrimoine',
  appName: 'MS Tech',
  webDir: 'ios-shell/www',
  backgroundColor: '#0a0a0b',
  server: {
    url,
    cleartext: url.startsWith('http://'),
    errorPath: 'index.html',
    // Bank consent pages open inside the app so the callback returns to the session.
    allowNavigation: ['*.biapi.pro', '*.powens.com', '*.leantech.me', '*.saltedge.com', '*.interactivebrokers.com'],
  },
  ios: { contentInset: 'never', scheme: 'MS Tech', limitsNavigationsToAppBoundDomains: false },
  plugins: {
    SplashScreen: { launchAutoHide: true, launchShowDuration: 600, backgroundColor: '#0a0a0b', showSpinner: false },
    StatusBar: { style: 'DARK', overlaysWebView: true },
  },
};

export default config;
