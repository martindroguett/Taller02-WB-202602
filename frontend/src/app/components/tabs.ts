import { Component, input, model } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

export interface OpcionTab {
  id: string;
  texto: string;
}

/** Selector de sección con el MatButtonToggleGroup de Angular Material. */
@Component({
  selector: 'vt-tabs',
  imports: [MatButtonToggleModule],
  template: `
    <mat-button-toggle-group
      [value]="valor()"
      (change)="valor.set($event.value)"
      [aria-label]="etiqueta()"
      hideSingleSelectionIndicator
    >
      @for (o of opciones(); track o.id) {
        <mat-button-toggle [value]="o.id">{{ o.texto }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
  `,
  styles: `
    :host {
      display: block;
    }
    mat-button-toggle-group {
      display: flex;
      padding: var(--space-1);
      gap: var(--space-1);
      border: 0;
      border-radius: var(--radius-pill);
      background: var(--surface-sunken);
      --mat-button-toggle-shape: var(--radius-pill);
      --mat-button-toggle-height: 44px;
      --mat-button-toggle-text-color: var(--ink-muted);
      --mat-button-toggle-background-color: transparent;
      --mat-button-toggle-selected-state-text-color: var(--on-ink);
      --mat-button-toggle-selected-state-background-color: var(--ink);
      --mat-button-toggle-divider-color: transparent;
      --mat-button-toggle-label-text-font: var(--font-sans);
      --mat-button-toggle-label-text-weight: 700;
      --mat-button-toggle-label-text-size: 15px;
    }
    mat-button-toggle {
      flex: 1;
      border: 0;
      border-radius: var(--radius-pill);
    }
  `,
})
export class Tabs {
  readonly opciones = input.required<OpcionTab[]>();
  readonly etiqueta = input('Secciones');
  readonly valor = model.required<string>();
}
