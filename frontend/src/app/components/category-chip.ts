import { Component, computed, input } from '@angular/core';
import { categoriaDe, Filtro } from '../models/vitrina';
import { Icon } from './icon';

@Component({
  selector: 'button[vt-category-chip]',
  imports: [Icon],
  host: {
    '[class]': '"vt-c-" + slug()',
    '[class.on]': 'active()',
    '[attr.aria-pressed]': 'active()',
  },
  template: `<span class="disco"
      ><vt-icon [name]="categoria().icono" [size]="20" [filled]="active()"
    /></span>
    <span>{{ categoria().nombre }}</span>
    @if (cuenta() !== null) {
      <span class="cuenta">{{ cuenta() }}</span>
    }`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-height: var(--tap-target);
      padding: 0 var(--space-4) 0 6px;
      border: 1.5px solid var(--line);
      border-radius: var(--radius-pill);
      background: var(--surface);
      color: var(--ink);
      font: var(--text-label);
      white-space: nowrap;
      cursor: pointer;
      transition:
        transform 120ms ease,
        background-color 160ms ease;
    }
    :host(:active) {
      transform: scale(0.96);
    }
    .disco {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-pill);
      background: var(--c-soft);
      color: var(--c-ink);
    }
    .cuenta {
      font: var(--text-catalog);
      opacity: 0.8;
    }
    :host(.on) {
      background: var(--c);
      border-color: var(--c);
      color: var(--on-vivid);
    }
    :host(.on) .disco {
      background: var(--surface);
    }
    :host(.vt-c-todas) {
      --c: var(--ink);
      --c-soft: var(--surface-sunken);
      --c-ink: var(--ink);
    }
    :host(.vt-c-todas.on) {
      color: var(--on-ink);
    }
    :host(.vt-c-todas.on) .disco {
      background: var(--brand);
      color: var(--on-brand);
    }
  `,
})
export class CategoryChip {
  readonly slug = input.required<Filtro>();
  readonly active = input(false);
  readonly cuenta = input<number | null>(null);

  protected readonly categoria = computed(() => {
    const slug = this.slug();
    return slug === 'todas' ? { nombre: 'Todas', icono: 'grid_view' } : categoriaDe(slug);
  });
}
