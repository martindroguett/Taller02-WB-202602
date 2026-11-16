/**
 * Detecta una sacudida a partir de las lecturas del acelerómetro (incluida la gravedad).
 *
 * Una sacudida va y vuelve: golpes cortos en direcciones opuestas, uno tras otro. Tomar el celular,
 * girarlo o caminar con él son movimientos de un solo sentido o más lentos, y no cuentan.
 * Por eso se quita la gravedad con un filtro y se cuentan los golpes que alternan de dirección.
 */
export class DetectorSacudida {
  /** Movimiento mínimo (m/s²) para contar un golpe. */
  static readonly UMBRAL = 5;
  /** Un golpe más largo que esto (ms) es un giro o levantar el celular, no una sacudida. */
  static readonly GOLPE_MAX_MS = 280;
  /** Tiempo máximo (ms) entre un golpe y el siguiente, que además va en sentido contrario. */
  static readonly ENTRE_GOLPES_MS = 350;
  /** Cambios de dirección seguidos que hacen una sacudida (3 = ida, vuelta, ida, vuelta). */
  static readonly VAIVENES = 3;
  /** Al empezar a escuchar se ignora este tiempo (ms): es cuando uno todavía está tomando el celular. */
  static readonly GRACIA_MS = 1200;
  /** Pausa (ms) tras una sacudida antes de aceptar otra. */
  static readonly PAUSA_MS = 2000;

  private gravedad: [number, number, number] | null = null;
  private inicio = 0;
  private ultimaMuestra = 0;
  // Golpe en curso: cuándo empezó y su punto más fuerte.
  private golpeDesde = -1;
  private golpeFuerza = 0;
  private golpeVector: [number, number, number] = [0, 0, 0];
  // Golpe anterior, para comparar la dirección.
  private previo: { vector: [number, number, number]; fin: number } | null = null;
  private vaivenes = 0;
  private ultimaSacudida = -Infinity;

  /** Procesa una lectura (en m/s²) tomada en el instante `t` (ms). Devuelve true si hubo sacudida. */
  muestra(x: number, y: number, z: number, t: number): boolean {
    if (!this.gravedad) {
      this.gravedad = [x, y, z];
      this.inicio = this.ultimaMuestra = t;
      return false;
    }
    // La gravedad cambia despacio (al girar el celular): se sigue con un filtro de ~0,3 s.
    const dt = Math.max(1, t - this.ultimaMuestra) / 1000;
    this.ultimaMuestra = t;
    const peso = Math.exp(-dt / 0.3);
    const g = this.gravedad;
    g[0] = peso * g[0] + (1 - peso) * x;
    g[1] = peso * g[1] + (1 - peso) * y;
    g[2] = peso * g[2] + (1 - peso) * z;

    const d: [number, number, number] = [x - g[0], y - g[1], z - g[2]];
    const fuerza = Math.hypot(...d);

    if (fuerza >= DetectorSacudida.UMBRAL) {
      // Si el movimiento se dio vuelta sin pasar por reposo, el golpe anterior terminó aquí.
      const dado = this.golpeDesde >= 0 && punto(d, this.golpeVector) < 0;
      const sacudida = dado ? this.cerrarGolpe(t) : false;
      if (this.golpeDesde < 0) {
        this.golpeDesde = t;
        this.golpeFuerza = 0;
      }
      if (fuerza > this.golpeFuerza) {
        this.golpeFuerza = fuerza;
        this.golpeVector = d;
      }
      return sacudida;
    }
    if (this.golpeDesde < 0 || fuerza >= DetectorSacudida.UMBRAL * 0.5) return false;
    return this.cerrarGolpe(t);
  }

  /** El golpe en curso terminó en `t`: lo compara con el anterior. Devuelve true si completa una sacudida. */
  private cerrarGolpe(t: number): boolean {
    const duracion = t - this.golpeDesde;
    const vector = this.golpeVector;
    this.golpeDesde = -1;
    if (t - this.inicio < DetectorSacudida.GRACIA_MS || duracion > DetectorSacudida.GOLPE_MAX_MS) {
      this.vaivenes = 0;
      this.previo = null;
      return false;
    }
    const previo = this.previo;
    this.previo = { vector, fin: t };
    const contrario =
      previo !== null &&
      t - previo.fin <= DetectorSacudida.ENTRE_GOLPES_MS &&
      punto(previo.vector, vector) < 0;
    this.vaivenes = contrario ? this.vaivenes + 1 : 0;

    if (
      this.vaivenes >= DetectorSacudida.VAIVENES &&
      t - this.ultimaSacudida > DetectorSacudida.PAUSA_MS
    ) {
      this.ultimaSacudida = t;
      this.vaivenes = 0;
      this.previo = null;
      return true;
    }
    return false;
  }
}

const punto = (a: readonly number[], b: readonly number[]): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
