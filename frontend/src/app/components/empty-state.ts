import { Component, input } from '@angular/core';
import { CategoriaSlug } from '../models/vitrina';
import { PieceArt } from './piece-art';

@Component({
  selector: 'vt-empty-state',
  imports: [PieceArt],
  host: { '[class]': '"vt-c-" + categoria()' },
  template: `
    <div class="circulo">
      <vt-piece-art class="dibujo" [categoria]="categoria()" [bare]="true" />
    </div>
    <h2 class="title">{{ titulo() }}</h2>
    <p class="vt-muted">{{ texto() }}</p>
    <div class="accion"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-8) var(--space-4);
      text-align: center;
    }
    .circulo {
      position: relative;
      width: 120px;
      height: 120px;
      margin-bottom: var(--space-3);
      border-radius: 50%;
      background: var(--c-soft);
    }
    .dibujo {
      position: absolute;
      inset: -22px -16px 0;
      width: calc(100% + 32px);
      height: calc(100% + 22px);
    }
    p {
      max-width: 32ch;
    }
    .accion {
      margin-top: var(--space-3);
    }
    .accion:empty {
      display: none;
    }
  `,
})
export class EmptyState {
  readonly titulo = input.required<string>();
  readonly texto = input.required<string>();
  readonly categoria = input<CategoriaSlug>('cartas');
}
