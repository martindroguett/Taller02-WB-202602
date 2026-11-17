import { Capacitor } from '@capacitor/core';

/** Dirección pública de Vitrina desplegada en Railway (Caddy sirve Angular y redirige /api al backend). */
const SITIO_PUBLICO = 'https://taller02-wb-202602-production.up.railway.app';

// En la web, Caddy redirige /api al backend y el navegador usa el mismo origen que Angular.
// En la app Android (Capacitor) la página se sirve desde https://localhost dentro del celular,
// así que /api no llegaría al servidor: ahí se usa la dirección completa del backend.
const nativa = Capacitor.isNativePlatform();

export const environment = {
  apiUrl: nativa ? `${SITIO_PUBLICO}/api` : '/api',
  /** Base de los enlaces que se comparten y de los QR: siempre la web pública. */
  sitioUrl: nativa ? SITIO_PUBLICO : window.location.origin,
};
