import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { PiezaPublica } from '../services/catalogo-publico.service';
import { InteraccionesService } from '../services/interacciones.service';
import { Icon } from './icon';

/** Un doble toque confirma el me gusta sin interferir con el botón accesible. */
@Component({
  selector: 'vt-like-burst',
  imports: [Icon],
  host: { '(dblclick)': 'darMeGusta()' },
  template: `
    <ng-content />
    <span class="confirmacion" [class.visible]="visible()" aria-hidden="true">
      <vt-icon name="favorite" [filled]="true" [size]="64" />
    </span>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
      touch-action: manipulation;
    }
    .confirmacion {
      position: absolute;
      inset: 10px;
      z-index: 1;
      display: grid;
      place-items: center;
      border: 3px solid rgba(255, 255, 255, 0.9);
      border-radius: var(--radius-lg);
      color: white;
      pointer-events: none;
      opacity: 0;
      transition: opacity 240ms ease-out;
    }
    .confirmacion.visible {
      opacity: 1;
    }
    .confirmacion vt-icon {
      filter: drop-shadow(0 3px 10px rgba(0, 0, 0, 0.35));
    }
    @media (prefers-reduced-motion: no-preference) {
      .confirmacion vt-icon {
        transform: scale(0.75);
        transition: transform 240ms cubic-bezier(0.2, 0, 0, 1);
      }
      .confirmacion.visible vt-icon {
        transform: scale(1);
      }
    }
  `,
})
export class LikeBurst {
  private readonly interacciones = inject(InteraccionesService);
  private readonly destroy = inject(DestroyRef);
  readonly pieza = input.required<PiezaPublica>();
  protected readonly visible = signal(false);
  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroy.onDestroy(() => clearTimeout(this.temporizador));
  }

  protected darMeGusta(): void {
    if (!this.interacciones.darMeGusta(this.pieza())) return;
    this.visible.set(true);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.visible.set(false), 700);
  }
}
