import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.applemaps.clone',
  appName: 'Карты',
  webDir: 'out',
  // Полноэкранный режим без полос браузера
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
