import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fit.resofit.chatb2k',
  appName: 'chatb2k',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'api.resofit.fit',
      '*.resofit.fit'
    ]
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    backgroundColor: '#0D0D0D',
    allowsLinkPreview: false,
    limitsNavigationsToAppBoundDomains: true
  },
  android: {
    backgroundColor: '#0D0D0D',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  }
};

export default config;
