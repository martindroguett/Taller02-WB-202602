import { Component, computed, inject, input } from '@angular/core';
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
      [attr.aria-pressed]="activo()"
      [attr.aria-label]="activo() ? 'Quitar me gusta' : 'Dar me gusta'"
      (click)="catalogo.toggleMeGusta(pieza().id)"
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
  readonly pieza = input.required<Pieza>();
  protected readonly activo = computed(() => this.catalogo.gustadas().has(this.pieza().id));
  protected readonly cuenta = computed(() => compacto(this.catalogo.megusta(this.pieza())));
}
