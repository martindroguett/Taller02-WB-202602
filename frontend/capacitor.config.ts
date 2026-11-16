import type { CapacitorConfig } from '@capacitor/cli';

// CAP_LOCAL=1 (npm run android:local): la app habla con el backend local por http. Nunca en producción.
const local = process.env['CAP_LOCAL'] === '1';

const config: CapacitorConfig = {
  appId: 'cl.vitrina.app',
  appName: 'Vitrina',
  // Carpeta que genera «ng build» (build de producción de Angular).
  webDir: 'dist/frontend/browser',
  android: {
    // La API de Railway usa https, así que no se permite tráfico http sin cifrar.
    allowMixedContent: local,
  },
  ...(local ? { server: { androidScheme: 'http', cleartext: true } } : {}),
  plugins: {
    // Íconos oscuros de la barra de estado sobre el fondo claro de la app.
    SystemBars: { style: 'LIGHT' },
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#2b4cff',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
