import { Component, input, model } from '@angular/core';

export interface OpcionTab {
  id: string;
  texto: string;
}

@Component({
  selector: 'vt-tabs',
  template: `
    <div role="group" [attr.aria-label]="etiqueta()">
      @for (o of opciones(); track o.id) {
        <button
          type="button"
          [attr.aria-pressed]="valor() === o.id"
          [class.on]="valor() === o.id"
          (click)="valor.set(o.id)"
        >
          {{ o.texto }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    [role='group'] {
      display: flex;
      gap: var(--space-1);
      padding: var(--space-1);
      border-radius: var(--radius-pill);
      background: var(--surface-sunken);
    }
    button {
      flex: 1;
      min-height: 44px;
      padding: 0 var(--space-4);
      border: 0;
      border-radius: var(--radius-pill);
      background: transparent;
      color: var(--ink-muted);
      font: var(--text-body-strong);
      cursor: pointer;
      transition:
        background-color 160ms ease,
        color 160ms ease,
        transform 120ms ease;
    }
    button:active {
      transform: scale(0.96);
    }
    button.on {
      background: var(--ink);
      color: var(--on-ink);
    }
  `,
})
export class Tabs {
  readonly opciones = input.required<OpcionTab[]>();
  readonly etiqueta = input('Secciones');
  readonly valor = model.required<string>();
}
