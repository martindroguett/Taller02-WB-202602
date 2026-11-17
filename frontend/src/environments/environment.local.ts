/**
 * Prueba en el celular con el backend de tu computador (npm run android:local).
 * `adb reverse tcp:8000 tcp:8000` hace que «localhost:8000» dentro del celular llegue a la API local.
 * No se usa en el build de producción ni en el APK de GitHub Actions.
 */
export const environment = {
  apiUrl: 'http://localhost:8000/api',
  sitioUrl: 'http://localhost',
};
