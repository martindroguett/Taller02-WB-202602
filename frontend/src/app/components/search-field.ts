import { Component, input, model } from '@angular/core';
import { Icon } from './icon';
import { IconButton } from './icon-button';

@Component({
  selector: 'vt-search-field',
  imports: [Icon, IconButton],
  template: `
    <label>
      <vt-icon name="search" [size]="24" />
      <input
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        [placeholder]="placeholder()"
        [attr.aria-label]="placeholder()"
        [value]="valor()"
        (input)="valor.set($any($event.target).value)"
      />
    </label>
    @if (valor()) {
      <button
        type="button"
        vt-icon-button
        tone="plain"
        icon="close"
        label="Borrar búsqueda"
        (click)="valor.set('')"
      ></button>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      min-height: 52px;
      padding: 0 var(--space-1) 0 var(--space-4);
      background: var(--surface);
      border-radius: var(--radius-pill);
      box-shadow: var(--shadow-card);
      color: var(--ink-muted);
    }
    :host(:focus-within) {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
    label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
      min-width: 0;
    }
    input {
      flex: 1;
      min-width: 0;
      height: 52px;
      border: 0;
      background: transparent;
      color: var(--ink);
      font: var(--text-body);
      outline: none;
    }
    input::placeholder {
      color: var(--ink-muted);
      opacity: 1;
    }
    input::-webkit-search-cancel-button {
      display: none;
    }
  `,
})
export class SearchField {
  readonly valor = model('');
  readonly placeholder = input('Busca una pieza');
}
