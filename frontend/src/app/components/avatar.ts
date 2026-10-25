import { Component, computed, input } from '@angular/core';
import { CATEGORIAS } from '../models/vitrina';

@Component({
  selector: 'vt-avatar',
  host: {
    '[class]': 'tono()',
    '[style.width.px]': 'tam()',
    '[style.height.px]': 'tam()',
    '[style.font-size.px]': 'tam() * 0.38',
    '[class.anillo-brand]': 'anillo() === "brand"',
    '[class.anillo-spark]': 'anillo() === "spark"',
    role: 'img',
    '[attr.aria-label]': 'nombre()',
  },
  template: `@if (src(); as s) {
      <img [src]="s" alt="" />
    } @else {
      {{ iniciales() }}
    }`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      border-radius: 34%;
      background: var(--c-soft);
      color: var(--c-ink);
      font-family: var(--font-sans);
      font-weight: 800;
      overflow: hidden;
      line-height: 1;
    }
    :host(.anillo-brand) {
      overflow: visible;
      box-shadow:
        0 0 0 2.5px var(--surface),
        0 0 0 5px var(--brand);
    }
    :host(.anillo-spark) {
      overflow: visible;
      box-shadow:
        0 0 0 2.5px var(--surface),
        0 0 0 5px var(--spark);
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class Avatar {
  readonly nombre = input.required<string>();
  readonly src = input<string>();
  readonly tam = input(44);
  readonly anillo = input<'none' | 'brand' | 'spark'>('none');

  protected readonly iniciales = computed(() =>
    this.nombre()
      .split(/[\s_.]+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase(),
  );

  protected readonly tono = computed(() => {
    const suma = [...this.nombre()].reduce((a, c) => a + c.charCodeAt(0), 0);
    return 'vt-c-' + CATEGORIAS[suma % CATEGORIAS.length].slug;
  });
}
