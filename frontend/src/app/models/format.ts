/** 1.284 → "1,3 k"; 12.000 → "12 k"; menos de mil se deja igual. */
export function compacto(n: number): string {
  if (n < 1000) return String(n);
  const k = Math.round(n / 100) / 10;
  return `${String(k).replace('.', ',')} k`;
}

/** Minutos atrás → "hace 2 h", "ayer", "12 oct". */
export function relativo(minutos: number): string {
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  if (minutos < 60 * 24) return `hace ${Math.floor(minutos / 60)} h`;
  if (minutos < 60 * 48) return 'ayer';
  const fecha = new Date(Date.now() - minutos * 60_000);
  return fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '');
}

/** Código de catálogo: 231 → "#0231". */
export const numeroCatalogo = (n: number): string => `#${String(n).padStart(4, '0')}`;
