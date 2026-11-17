import { Component, input, output } from '@angular/core';
import { Icon } from './icon';

/** Radios (km) que se pueden elegir para «Cerca de mí». */
export const RADIOS_KM = [2, 10, 50, 200] as const;

/**
 * Las funciones del celular en Explorar: escanear un código con la cámara (solo en la app, porque
 * en el navegador no hay lector) y ver piezas cerca de ti con el GPS. La sorpresa del acelerómetro
 * no tiene botón: ocurre al agitar el celular. En pantallas anchas los botones son píldoras compactas.
 */
@Component({
  selector: 'vt-acciones-movil',
  imports: [Icon],
  template: `
    <div
      class="acciones"
      [class.sin-boton-ancho]="!escaner()"
      role="toolbar"
      aria-label="Funciones del celular"
    >
      @if (escaner()) {
        <button type="button" class="accion" [disabled]="escaneando()" (click)="escanear.emit()">
          <vt-icon name="qr_code_scanner" [size]="22" />
          <span class="nombre">{{ escaneando() ? 'Leyendo…' : 'Escanear' }}</span>
        </button>
      }
      <button
        type="button"
        class="accion"
        [class.activa]="cercaActiva()"
        [disabled]="ubicando()"
        [attr.aria-pressed]="cercaActiva()"
        (click)="cerca.emit()"
      >
        <vt-icon name="near_me" [size]="22" [filled]="cercaActiva()" />
        <span class="nombre">{{ ubicando() ? 'Ubicándote…' : 'Cerca de mí' }}</span>
      </button>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .acciones {
      display: flex;
      gap: var(--space-2);
    }
    .accion {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      min-height: 60px;
      padding: var(--space-2);
      border: 2px solid transparent;
      border-radius: var(--radius-md);
      background: var(--surface);
      color: var(--brand);
      box-shadow: var(--shadow-card);
      cursor: pointer;
      transition:
        transform 120ms ease,
        background-color 160ms ease,
        color 160ms ease;
    }
    .accion:active {
      transform: scale(0.96);
    }
    .accion:disabled {
      opacity: 0.6;
      cursor: progress;
    }
    .nombre {
      color: var(--ink);
      font: var(--text-label);
      white-space: nowrap;
    }
    .accion.activa {
      background: var(--brand);
      color: var(--on-brand);
      box-shadow: var(--shadow-brand);
    }
    .accion.activa .nombre {
      color: var(--on-brand);
    }
    @media (min-width: 600px) {
      .acciones {
        flex-wrap: wrap;
      }
      /* Píldora compacta con el ícono al lado del texto, en vez de una tarjeta alta. */
      .accion {
        flex: none;
        flex-direction: row;
        gap: var(--space-2);
        min-height: 44px;
        padding: 0 var(--space-4) 0 var(--space-3);
        border-color: var(--line-strong);
        border-radius: var(--radius-pill);
        box-shadow: none;
      }
      .accion:not(.activa):not(:disabled):hover {
        border-color: var(--brand);
        background: var(--brand-soft);
      }
      .accion.activa {
        border-color: var(--brand);
      }
    }
    /* Desde 1000 px «Cerca de mí» va junto a las categorías (en Explorar). */
    @media (min-width: 1000px) {
      .acciones.sin-boton-ancho {
        display: none;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .accion {
        transition: none;
      }
    }
  `,
})
export class AccionesMovil {
  /** Mostrar «Escanear»: solo tiene sentido donde hay cámara (la app). */
  readonly escaner = input(true);
  readonly escaneando = input(false);
  readonly ubicando = input(false);
  readonly cercaActiva = input(false);
  readonly escanear = output<void>();
  readonly cerca = output<void>();
}
