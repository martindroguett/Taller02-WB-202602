import { Component, input } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'button[vt-icon-button], a[vt-icon-button]',
  imports: [Icon],
  host: {
    '[attr.aria-label]': 'label()',
    '[attr.aria-pressed]': 'pressed()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
    '[class.on]': 'active()',
  },
  template: `<vt-icon [name]="icon()" [filled]="active()" [size]="24" />`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      width: var(--tap-target);
      height: var(--tap-target);
      flex: none;
      border: 0;
      padding: 0;
      border-radius: 34%;
      cursor: pointer;
      background: transparent;
      color: var(--ink);
      transition:
        transform 120ms ease,
        background-color 160ms ease,
        box-shadow 160ms ease;
    }
    :host([data-size='sm']) {
      position: relative;
      width: 36px;
      height: 36px;
    }

    /* Conserva 44 px de área táctil aunque el botón se dibuje a 36 px. */
    :host([data-size='sm'])::after {
      content: '';
      position: absolute;
      inset: -4px;
    }
    :host(:active) {
      transform: scale(0.96);
    }
    :host(:disabled) {
      opacity: 0.45;
      pointer-events: none;
    }
    :host([data-tone='sunken']) {
      background: var(--surface-sunken);
    }
    :host([data-tone='glass']) {
      background: var(--glass);
      color: var(--ink);
      box-shadow: var(--shadow-card);
    }
    :host([data-tone='surface']) {
      background: var(--surface);
      box-shadow: var(--shadow-card);
    }
    :host([data-tone='danger']) {
      background: var(--danger-soft);
      color: var(--danger);
    }
    :host(.on[data-tone='glass']),
    :host(.on[data-tone='sunken']),
    :host(.on[data-tone='surface']) {
      color: var(--brand);
    }
  `,
})
export class IconButton {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly tone = input<'plain' | 'sunken' | 'glass' | 'surface' | 'danger'>('sunken');
  readonly active = input(false);
  readonly pressed = input<boolean | null>(null);
  readonly size = input<'md' | 'sm'>('md');
}
