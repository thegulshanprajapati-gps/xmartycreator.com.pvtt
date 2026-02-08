import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xmarty.creator',
  appName: 'Xmarty Creator',
  webDir: 'www',
  // Set this to your live site URL when you want the APK to load the web app
  // Example: 'https://xmartycreator.com'
  server: {
    url: 'https://xmartycreator.com',
    cleartext: true
  }
};

export default config;
