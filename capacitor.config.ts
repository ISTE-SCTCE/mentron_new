import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mentron.app',
  appName: 'Mentron',
  webDir: 'out',
  server: {
    url: 'https://mentron.istesctce.in',
    cleartext: true
  }
};

export default config;
