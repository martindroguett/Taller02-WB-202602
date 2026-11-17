import { Injectable } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Motion } from '@capacitor/motion';
import {
  BarcodeScanner,
  GoogleBarcodeScannerModuleInstallState,
} from '@capacitor-mlkit/barcode-scanning';
import { DetectorSacudida } from './sacudida';

/** Error con un mensaje listo para mostrarle a la persona. Los `cancelado` no se muestran. */
export class ErrorDispositivo extends Error {
  constructor(
    message: string,
    readonly motivo: 'permiso' | 'no-disponible' | 'cancelado' | 'fallo',
  ) {
    super(message);
  }
}

export interface Coordenadas {
  latitud: number;
  longitud: number;
  precision: number;
}

const AJUSTES = 'Actívalo en Ajustes › Apps › Vitrina › Permisos.';

/**
 * Capacidades del celular que usa Vitrina, mediante plugins de Capacitor:
 * cámara (lectura de QR y códigos de barras), GPS y acelerómetro.
 * Cada método pide el permiso cuando hace falta y traduce los errores a mensajes claros.
 */
@Injectable({ providedIn: 'root' })
export class DispositivoService {
  readonly nativa = Capacitor.isNativePlatform();

  // ───────────── Cámara: QR y códigos de barras ─────────────

  /** Abre la cámara y devuelve el texto del primer QR o código de barras que lea. */
  async escanear(alPreparar?: () => void): Promise<string> {
    if (!this.nativa) {
      throw new ErrorDispositivo(
        'El escáner usa la cámara del celular: ábrelo desde la app Android de Vitrina.',
        'no-disponible',
      );
    }
    const { supported } = await BarcodeScanner.isSupported();
    if (!supported) {
      throw new ErrorDispositivo(
        'Este dispositivo no puede leer códigos con la cámara.',
        'no-disponible',
      );
    }

    let { camera } = await BarcodeScanner.checkPermissions();
    if (camera !== 'granted' && camera !== 'limited') {
      ({ camera } = await BarcodeScanner.requestPermissions());
    }
    if (camera !== 'granted' && camera !== 'limited') {
      throw new ErrorDispositivo(
        `Vitrina necesita la cámara para leer el código. ${AJUSTES}`,
        'permiso',
      );
    }

    // El lector de Google se descarga una sola vez mediante Google Play Services.
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) await this.instalarLector(alPreparar);

    try {
      const { barcodes } = await BarcodeScanner.scan();
      const valor = barcodes[0]?.rawValue?.trim();
      if (!valor) throw new ErrorDispositivo('No se leyó ningún código.', 'cancelado');
      return valor;
    } catch (e) {
      if (e instanceof ErrorDispositivo) throw e;
      const texto = String((e as Error)?.message ?? e).toLowerCase();
      if (texto.includes('cancel')) throw new ErrorDispositivo('Lectura cancelada.', 'cancelado');
      throw new ErrorDispositivo('No pudimos leer el código. Inténtalo de nuevo.', 'fallo');
    }
  }

  /** Descarga el lector de códigos y espera a que termine, para no pedirle a la persona que reintente. */
  private async instalarLector(alPreparar?: () => void): Promise<void> {
    alPreparar?.();
    const error = () =>
      new ErrorDispositivo(
        'No pudimos preparar el lector de códigos. Revisa tu conexión e inténtalo de nuevo.',
        'fallo',
      );
    let escucha: PluginListenerHandle | undefined;
    try {
      await new Promise<void>((resolver, rechazar) => {
        const limite = setTimeout(rechazar, 60_000, error());
        BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', ({ state }) => {
          if (state === GoogleBarcodeScannerModuleInstallState.COMPLETED) {
            clearTimeout(limite);
            resolver();
          } else if (
            state === GoogleBarcodeScannerModuleInstallState.FAILED ||
            state === GoogleBarcodeScannerModuleInstallState.CANCELED
          ) {
            clearTimeout(limite);
            rechazar(error());
          }
        })
          .then((h) => {
            escucha = h;
            return BarcodeScanner.installGoogleBarcodeScannerModule();
          })
          .catch((e) => {
            clearTimeout(limite);
            rechazar(e);
          });
      });
    } catch (e) {
      throw e instanceof ErrorDispositivo ? e : error();
    } finally {
      void escucha?.remove();
    }
  }

  // ───────────── Ubicación (GPS) ─────────────

  /** Nombre de la ciudad o comuna de unas coordenadas (OpenStreetMap). Si falla, `null`. */
  async ciudad(latitud: number, longitud: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=es&lat=${latitud}&lon=${longitud}`;
      const { address } = await (await fetch(url)).json();
      const lugar = address?.city ?? address?.town ?? address?.village ?? address?.municipality ?? address?.county;
      return typeof lugar === 'string' ? lugar.slice(0, 100) : null;
    } catch {
      return null;
    }
  }

  /** Pide permiso si hace falta y devuelve la ubicación actual. */
  async ubicacion(): Promise<Coordenadas> {
    try {
      if (this.nativa) {
        let estado = await Geolocation.checkPermissions();
        if (estado.location !== 'granted' && estado.coarseLocation !== 'granted') {
          estado = await Geolocation.requestPermissions({
            permissions: ['location', 'coarseLocation'],
          });
        }
        if (estado.location !== 'granted' && estado.coarseLocation !== 'granted') {
          throw new ErrorDispositivo(
            `Sin permiso de ubicación no podemos usar tu posición. ${AJUSTES}`,
            'permiso',
          );
        }
      }
      const { coords } = await this.posicion();
      return { latitud: coords.latitude, longitud: coords.longitude, precision: coords.accuracy };
    } catch (e) {
      if (e instanceof ErrorDispositivo) throw e;
      const texto = String((e as Error)?.message ?? e).toLowerCase();
      const codigo = (e as { code?: unknown })?.code;
      if (codigo === 1 || texto.includes('denied') || texto.includes('permission')) {
        throw new ErrorDispositivo(
          'Sin permiso de ubicación no podemos usar tu posición. Actívalo en los ajustes.',
          'permiso',
        );
      }
      if (
        texto.includes('disabled') ||
        texto.includes('not enabled') ||
        texto.includes('unavailable')
      ) {
        throw new ErrorDispositivo(
          'La ubicación del celular está apagada. Enciéndela e inténtalo de nuevo.',
          'no-disponible',
        );
      }
      if (codigo === 3 || texto.includes('timeout')) {
        throw new ErrorDispositivo(
          'No logramos ubicarte a tiempo. Prueba al aire libre o inténtalo otra vez.',
          'fallo',
        );
      }
      throw new ErrorDispositivo('No pudimos obtener tu ubicación.', 'fallo');
    }
  }

  /** GPS preciso; si no responde a tiempo (por ejemplo bajo techo) usa la ubicación aproximada de la red. */
  private async posicion() {
    try {
      return await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      });
    } catch (e) {
      const texto = String((e as Error)?.message ?? e).toLowerCase();
      if ((e as { code?: unknown })?.code !== 3 && !texto.includes('timeout')) throw e;
      return Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60_000,
      });
    }
  }

  // ───────────── Acelerómetro: agitar el celular ─────────────

  /**
   * Llama a `alAgitar` cada vez que se sacude el celular, con una pausa entre sacudidas.
   * Devuelve una función para dejar de escuchar. Sin acelerómetro lanza ErrorDispositivo.
   */
  async escucharSacudidas(alAgitar: () => void): Promise<() => void> {
    if (typeof DeviceMotionEvent === 'undefined') {
      throw new ErrorDispositivo(
        'Este dispositivo no tiene sensor de movimiento.',
        'no-disponible',
      );
    }
    // iOS (Safari) exige un permiso explícito para el sensor; Android no.
    const pedir = (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission;
    if (typeof pedir === 'function' && (await pedir().catch(() => 'denied')) !== 'granted') {
      throw new ErrorDispositivo('Sin permiso para el sensor de movimiento.', 'permiso');
    }

    const detector = new DetectorSacudida();
    let handle: PluginListenerHandle | undefined;
    try {
      handle = await Motion.addListener('accel', ({ accelerationIncludingGravity: a }) => {
        if (a && detector.muestra(a.x ?? 0, a.y ?? 0, a.z ?? 0, Date.now())) alAgitar();
      });
    } catch {
      throw new ErrorDispositivo('No pudimos activar el sensor de movimiento.', 'no-disponible');
    }
    return () => void handle?.remove();
  }
}

/** Mensaje para mostrar ante un error de DispositivoService, o null si no hay que avisar. */
export function mensajeDispositivo(e: unknown): string | null {
  if (e instanceof ErrorDispositivo) return e.motivo === 'cancelado' ? null : e.message;
  return 'Ocurrió un error con la función del dispositivo.';
}

/** Interpreta un código leído: un enlace de Vitrina (QR de pieza o perfil) o un código de producto. */
export function interpretarCodigo(
  valor: string,
):
  | { tipo: 'pieza'; id: number }
  | { tipo: 'coleccionista'; username: string }
  | { tipo: 'producto'; codigo: string } {
  const pieza = valor.match(/\/pieza\/(\d+)(?:[/?#]|$)/);
  if (pieza) return { tipo: 'pieza', id: Number(pieza[1]) };
  const perfil = valor.match(/\/(?:coleccionistas|perfil)\/([\w.-]+)(?:[/?#]|$)/);
  if (perfil) return { tipo: 'coleccionista', username: decodeURIComponent(perfil[1]) };
  return { tipo: 'producto', codigo: valor.slice(0, 128) };
}
