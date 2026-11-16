import { Component, input, output } from '@angular/core';
import { Icon } from './icon';

/** Radios (km) que se pueden elegir para «Cerca de mí». */
export const RADIOS_KM = [2, 10, 50, 200] as const;

/**
 * Las funciones del celular en Explorar: escanear un código con la cámara y ver piezas cerca
 * de ti con el GPS. La sorpresa del acelerómetro no tiene botón: ocurre al agitar el celular.
 */
@Component({
  selector: 'vt-acciones-movil',
  imports: [Icon],
  template: `
    <div class="acciones" role="toolbar" aria-label="Funciones del celular">
      <button type="button" class="accion" [disabled]="escaneando()" (click)="escanear.emit()">
        <vt-icon name="qr_code_scanner" [size]="22" />
        <span class="nombre">{{ escaneando() ? 'Leyendo…' : 'Escanear' }}</span>
      </button>
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
    @if (cercaActiva()) {
      <div class="radios" role="radiogroup" aria-label="Mostrar piezas a menos de">
        @for (r of radios; track r) {
          <button
            type="button"
            class="radio"
            role="radio"
            [attr.aria-checked]="radioKm() === r"
            [class.elegido]="radioKm() === r"
            (click)="radioKmChange.emit(r)"
          >
            {{ r }} km
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .acciones {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-2);
    }
    .accion {
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
    .radios {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--space-2);
    }
    .radio {
      min-height: 36px;
      padding: 0 var(--space-2);
      border: 2px solid var(--line-strong);
      border-radius: var(--radius-pill);
      background: var(--surface);
      color: var(--ink);
      font: var(--text-label);
      cursor: pointer;
    }
    .radio.elegido {
      border-color: var(--brand);
      background: var(--brand-soft);
      color: var(--brand);
    }
    @media (min-width: 600px) {
      .acciones {
        grid-template-columns: repeat(2, minmax(0, 200px));
      }
      .radios {
        grid-template-columns: repeat(4, 96px);
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
  readonly escaneando = input(false);
  readonly ubicando = input(false);
  readonly cercaActiva = input(false);
  readonly radioKm = input<number>(10);
  protected readonly radios = RADIOS_KM;
  readonly escanear = output<void>();
  readonly cerca = output<void>();
  readonly radioKmChange = output<number>();
}
