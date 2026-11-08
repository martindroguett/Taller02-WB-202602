import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { PiezaPublica } from '../services/catalogo-publico.service';
import { InteraccionesService } from '../services/interacciones.service';
import { compacto } from '../models/format';
import { Icon } from './icon';

@Component({
  selector: 'vt-like-button',
  imports: [Icon],
  template: `
    <button
      type="button"
      [class.on]="activo()"
      [class.latido]="latido()"
      [attr.aria-pressed]="activo()"
      [attr.aria-label]="activo() ? 'Quitar me gusta' : 'Dar me gusta'"
      [attr.aria-busy]="ocupado()"
      (click)="alternar()"
    >
      <span class="corazon"><vt-icon name="favorite" [filled]="activo()" [size]="24" /></span>
      <span class="num">{{ cuenta() }}</span>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-height: var(--tap-target);
      padding: 0 var(--space-4) 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-pill);
      background: var(--surface-sunken);
      color: var(--ink);
      font: var(--text-body-strong);
      cursor: pointer;
      transition: transform 120ms ease;
    }
    button:active {
      transform: scale(0.96);
    }
    button.on .corazon {
      color: var(--like);
    }
    @media (prefers-reduced-motion: no-preference) {
      button.latido .corazon {
        animation: latido 380ms ease-out;
      }
      @keyframes latido {
        40% {
          transform: scale(1.35);
        }
      }
    }
    .corazon {
      display: inline-flex;
    }
    .num {
      white-space: nowrap;
    }
  `,
})
export class LikeButton {
  private readonly interacciones = inject(InteraccionesService);
  readonly pieza = input.required<PiezaPublica>();
  protected readonly activo = computed(() => this.interacciones.estado(this.pieza()).gustada);
  protected readonly latido = signal(false);
  private previo = false;
  protected readonly cuenta = computed(() => compacto(this.interacciones.estado(this.pieza()).megusta));
  constructor() {
    // El corazón late solo cuando pasa de apagado a encendido, no al cargar la pieza ya gustada.
    effect(() => {
      const ahora = this.activo();
      if (ahora && !untracked(() => this.previo)) {
        this.latido.set(true);
        setTimeout(() => this.latido.set(false), 400);
      }
      this.previo = ahora;
    });
  }

  protected readonly ocupado = computed(() => this.interacciones.ocupada(this.pieza().id));
  protected alternar(): void {
    this.interacciones.alternarMeGusta(this.pieza());
  }
}
