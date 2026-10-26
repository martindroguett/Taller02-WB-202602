import { Component, input, model } from '@angular/core';
import { Icon } from './icon';

let siguienteId = 0;

@Component({
  selector: 'vt-text-field',
  imports: [Icon],
  template: `
    <label class="label" [for]="id">{{ label() }}</label>
    <div class="caja" [class.error]="!!error()">
      @if (icono()) {
        <vt-icon class="prefijo" [name]="icono()" [size]="22" />
      }
      @if (multilinea()) {
        <textarea
          [id]="id"
          rows="4"
          [attr.maxlength]="maxLength()"
          [placeholder]="placeholder()"
          [value]="valor()"
          [attr.aria-invalid]="!!error()"
          [attr.aria-describedby]="error() || ayuda() ? id + '-nota' : null"
          (input)="valor.set($any($event.target).value)"
        ></textarea>
      } @else {
        <input
          [id]="id"
          [type]="tipo()"
          [attr.maxlength]="maxLength()"
          [attr.autocomplete]="autocomplete()"
          [placeholder]="placeholder()"
          [value]="valor()"
          [attr.aria-invalid]="!!error()"
          [attr.aria-describedby]="error() || ayuda() ? id + '-nota' : null"
          (input)="valor.set($any($event.target).value)"
        />
      }
      <span class="sufijo"><ng-content select="[sufijo]" /></span>
    </div>
    @if (error(); as e) {
      <p class="nota error-txt" [id]="id + '-nota'">
        <vt-icon name="error" [filled]="true" [size]="16" />{{ e }}
      </p>
    } @else if (ayuda()) {
      <p class="nota caption" [id]="id + '-nota'">{{ ayuda() }}</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .label {
      font: var(--text-label);
    }
    .caja {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--surface);
      border: 1.5px solid var(--line-strong);
      border-radius: var(--radius-md);
    }
    .caja:focus-within {
      border-color: var(--ink);
    }
    .prefijo {
      margin-left: 16px;
      color: var(--ink-muted);
    }
    .prefijo + input {
      padding-left: 10px;
    }
    .caja.error {
      border: 2px solid var(--danger);
    }
    input,
    textarea {
      flex: 1;
      min-width: 0;
      border: 0;
      background: transparent;
      color: var(--ink);
      font: var(--text-body);
      padding: 0 var(--space-4);
      outline: none;
      resize: vertical;
    }
    input {
      min-height: 52px;
    }
    textarea {
      padding: 14px var(--space-4);
      min-height: 112px;
    }
    input::placeholder,
    textarea::placeholder {
      color: var(--ink-muted);
      opacity: 1;
    }
    .caja:focus-within {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
    .sufijo {
      display: inline-flex;
      padding-right: var(--space-1);
    }
    .sufijo:empty {
      display: none;
    }
    .nota {
      color: var(--ink-muted);
    }
    .error-txt {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      color: var(--danger);
      font: var(--text-label);
    }
    .error-txt vt-icon {
      margin-top: 1px;
    }
    .caption {
      font: var(--text-caption);
    }
  `,
})
export class TextField {
  protected readonly id = `vt-campo-${++siguienteId}`;
  readonly label = input.required<string>();
  readonly icono = input('');
  readonly valor = model('');
  readonly tipo = input<'text' | 'email' | 'password'>('text');
  readonly placeholder = input('');
  readonly maxLength = input<number | null>(null);
  readonly ayuda = input('');
  readonly error = input('');
  readonly multilinea = input(false);
  readonly autocomplete = input<string>();
}
