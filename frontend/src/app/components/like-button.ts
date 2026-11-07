import { Component, computed, inject, input } from '@angular/core';
import { PiezaPublica } from '../services/catalogo-publico.service';
import { CatalogoService } from '../services/catalogo.service';
import { InteraccionesService } from '../services/interacciones.service';
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
  private readonly interacciones = inject(InteraccionesService);
  readonly pieza = input.required<Pieza | PiezaPublica>();
  // Las piezas de la API ('dueno' in p) se guardan con InteraccionesService; las de muestra, en memoria.
  protected readonly activo = computed(() => {
    const p = this.pieza();
    return 'dueno' in p ? this.interacciones.estado(p).gustada : this.catalogo.gustadas().has(p.id);
  });
  protected readonly cuenta = computed(() => {
    const p = this.pieza();
    return compacto('dueno' in p ? this.interacciones.estado(p).megusta : this.catalogo.megusta(p));
  });
  protected readonly ocupado = computed(() => this.interacciones.ocupada(this.pieza().id));
  protected alternar(): void {
    const p = this.pieza();
    if ('dueno' in p) this.interacciones.alternarMeGusta(p);
    else this.catalogo.toggleMeGusta(p.id);
  }
}
