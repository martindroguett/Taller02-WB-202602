import { Component, input } from '@angular/core';

@Component({
  selector: 'vt-logo',
  host: { '[attr.data-tono]': 'tono()', role: 'img', 'aria-label': 'Vitrina' },
  template: `
    <svg [attr.width]="tam()" [attr.height]="tam()" viewBox="0 0 40 40" aria-hidden="true">
      <rect class="cuadro" x="4" y="4" width="32" height="32" rx="9" />
      <rect class="vidrio" x="8" y="8" width="24" height="24" rx="5" />
      <path class="repisa" d="M8 27h24" />
      <circle class="punto" cx="20" cy="21.5" r="4.5" />
      <path class="brillo" d="M11.5 16.5l7-5" />
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
    .vidrio {
      fill: var(--on-brand);
      fill-opacity: 0.22;
    }
    .repisa,
    .brillo {
      fill: none;
      stroke-linecap: round;
    }
    .repisa {
      stroke: var(--on-brand);
      stroke-width: 3;
    }
    .brillo {
      stroke: var(--on-brand);
      stroke-opacity: 0.8;
      stroke-width: 2;
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
    :host([data-tono='invert']) .vidrio {
      fill: var(--brand);
      fill-opacity: 0.16;
    }
    :host([data-tono='invert']) .repisa {
      stroke: var(--brand);
    }
    :host([data-tono='invert']) .brillo {
      stroke: var(--brand);
      stroke-opacity: 0.7;
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
