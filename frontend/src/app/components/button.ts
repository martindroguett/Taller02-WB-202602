import { Component, input } from '@angular/core';
import { Icon } from './icon';

export type VarianteBoton = 'primary' | 'accent' | 'secondary' | 'danger' | 'destructive';

@Component({
  selector: 'button[vt-button], a[vt-button]',
  imports: [Icon],
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[class.block]': 'block()',
  },
  template: `@if (icon(); as i) {
      <vt-icon [name]="i" [size]="20" />
    }
    <ng-content />`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      min-height: var(--tap-target);
      padding: 0 var(--space-5);
      border: 2px solid transparent;
      border-radius: var(--radius-pill);
      font: var(--text-body-strong);
      cursor: pointer;
      user-select: none;
      text-align: center;
      transition:
        transform 120ms ease,
        box-shadow 160ms ease,
        background-color 160ms ease;
    }
    :host(.block) {
      display: flex;
      width: 100%;
    }
    :host(:active) {
      transform: scale(0.96);
    }
    :host(:disabled),
    :host([aria-disabled='true']) {
      opacity: 0.45;
      box-shadow: none;
      pointer-events: none;
    }

    :host([data-size='sm']) {
      padding: 0 var(--space-4);
      font: var(--text-label);
    }
    :host([data-size='md']) {
      min-height: 48px;
    }
    :host([data-size='lg']) {
      min-height: 56px;
      padding: 0 var(--space-6);
      font-size: 16px;
    }

    :host([data-variant='primary']) {
      background: var(--ink);
      color: var(--on-ink);
    }
    @media (hover: hover) {
      :host([data-variant='primary']:hover) {
        box-shadow: var(--shadow-pop);
      }
    }
    :host([data-variant='accent']) {
      background: var(--brand);
      color: var(--on-brand);
    }
    @media (hover: hover) {
      :host([data-variant='accent']:hover) {
        box-shadow: var(--shadow-brand);
      }
    }
    :host([data-variant='secondary']) {
      background: var(--surface);
      color: var(--ink);
      border-color: var(--line-strong);
    }
    @media (hover: hover) {
      :host([data-variant='secondary']:hover) {
        background: var(--surface-sunken);
      }
    }
    :host([data-variant='danger']) {
      background: var(--danger-soft);
      color: var(--danger);
    }
    :host([data-variant='destructive']) {
      background: var(--danger);
      color: var(--on-danger);
    }
  `,
})
export class Button {
  readonly variant = input<VarianteBoton>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly icon = input<string>();
  readonly block = input(false);
}
