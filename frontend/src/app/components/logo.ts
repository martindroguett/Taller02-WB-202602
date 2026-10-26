import { Component, input } from '@angular/core';

@Component({
  selector: 'vt-logo',
  host: { '[attr.data-tono]': 'tono()', role: 'img', 'aria-label': 'Vitrina' },
  template: `
    <svg [attr.width]="tam()" [attr.height]="tam()" viewBox="0 0 40 40" aria-hidden="true">
      <g transform="rotate(-8 20 20)">
        <rect class="cuadro" x="3" y="3" width="34" height="34" rx="11" />
        <path class="v" d="M12 12.5 20 28l8-15.5" />
        <circle class="punto" cx="30" cy="10" r="3.2" />
      </g>
    </svg>
    @if (!soloMarca()) {
      <span class="nombre">Vitrina</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }
    .cuadro {
      fill: var(--brand);
    }
    .v {
      fill: none;
      stroke: var(--on-brand);
      stroke-width: 5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .punto {
      fill: var(--spark);
    }
    .nombre {
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 20px;
      letter-spacing: -0.03em;
      color: var(--ink);
    }
    :host([data-tono='invert']) .cuadro {
      fill: var(--on-brand);
    }
    :host([data-tono='invert']) .v {
      stroke: var(--brand);
    }
    :host([data-tono='invert']) .nombre {
      color: var(--on-brand);
    }
  `,
})
export class Logo {
  readonly tam = input(36);
  readonly soloMarca = input(false);
  readonly tono = input<'default' | 'invert'>('default');
}
