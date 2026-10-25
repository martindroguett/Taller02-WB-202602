import { Component, computed, input } from '@angular/core';
import { categoriaDe, CategoriaSlug } from '../models/vitrina';
import { numeroCatalogo } from '../models/format';

@Component({
  selector: 'vt-catalog-tag',
  host: { '[class]': '"vt-c-" + categoria()', '[class.compacta]': 'compacta()' },
  template: `<span class="punto" aria-hidden="true"></span>{{ texto() }}`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 10px;
      border-radius: var(--radius-pill);
      background: var(--glass);
      color: var(--ink);
      font: var(--text-catalog);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      box-shadow: var(--shadow-card);
      white-space: nowrap;
    }
    :host(.compacta) {
      gap: 4px;
      padding: 5px 8px;
    }
    .punto {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--c);
    }
  `,
})
export class CatalogTag {
  readonly categoria = input.required<CategoriaSlug>();
  readonly numero = input.required<number>();
  readonly compacta = input(false);
  protected readonly texto = computed(
    () =>
      `${categoriaDe(this.categoria()).codigo}${this.compacta() ? ' ' : ' · '}${numeroCatalogo(this.numero())}`,
  );
}
