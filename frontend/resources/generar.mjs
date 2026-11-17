// Genera las imágenes base del ícono y la pantalla de inicio a partir del logo de Vitrina.
// Uso: node resources/generar.mjs && npx capacitor-assets generate --android
import sharp from 'sharp';

const logo = (tam) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${tam}" height="${tam}"><rect x="8" y="8" width="24" height="24" rx="5" fill="#fff" fill-opacity=".22"/><path d="M8 27h24" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="21.5" r="4.5" fill="#ff5a3c"/><path d="M11.5 16.5l7-5" stroke="#fff" stroke-opacity=".8" stroke-width="2" stroke-linecap="round"/></svg>`;
const fondo = (tam) => ({ create: { width: tam, height: tam, channels: 4, background: '#2b4cff' } });

// Ícono: el logo sobre fondo azul (Android recorta la forma según el launcher).
await sharp(fondo(1024)).composite([{ input: Buffer.from(logo(760)), gravity: 'center' }]).png().toFile('resources/icon-only.png');
await sharp(Buffer.from(logo(1024))).resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile('resources/icon-foreground.png');
await sharp(fondo(1024)).png().toFile('resources/icon-background.png');
// Pantalla de inicio: el logo centrado sobre el azul de la marca.
for (const nombre of ['splash', 'splash-dark']) {
  await sharp(fondo(2732)).composite([{ input: Buffer.from(logo(700)), gravity: 'center' }]).png().toFile(`resources/${nombre}.png`);
}
console.log('Imágenes generadas en resources/');
