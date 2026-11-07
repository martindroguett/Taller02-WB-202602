import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { PiezaPublica } from '../services/catalogo-publico.service';
import { CatalogoService } from '../services/catalogo.service';
import { compacto } from '../models/format';
import { Pieza } from '../models/vitrina';
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
      [attr.aria-label]="
        ('dueno' in pieza() ? 'Pendiente de conectar: ' : '') +
        (activo() ? 'Quitar me gusta' : 'Dar me gusta')
      "
      [title]="'dueno' in pieza() ? 'Pendiente de conectar' : ''"
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
  protected readonly catalogo = inject(CatalogoService);
  readonly pieza = input.required<Pieza | PiezaPublica>();
  private readonly toast = inject(ToastService);
  protected readonly activo = computed(() => {
    const p = this.pieza();
    return 'dueno' in p ? p.gustada : this.catalogo.gustadas().has(p.id);
  });
  protected readonly latido = signal(false);
  private previo = false;
  protected readonly cuenta = computed(() => {
    const p = this.pieza();
    return compacto('dueno' in p ? p.megusta : this.catalogo.megusta(p));
  });
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

  protected alternar(): void {
    const p = this.pieza();
    if ('dueno' in p) this.toast.show('Me gusta está pendiente de conectar');
    else this.catalogo.toggleMeGusta(p.id);
  }
}
