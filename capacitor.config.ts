import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jibajaba.crm',
  appName: 'Jiba Jaba CRM',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
