import { Component, effect, forwardRef, input, model, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { Icon } from './icon';

let siguienteId = 0;

/** Campo de texto con MatFormField y matInput. La etiqueta va arriba y el error lo decide quien lo usa. */
@Component({
  selector: 'vt-text-field',
  imports: [Icon, MatFormFieldModule, MatInputModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextField), multi: true },
  ],
  template: `
    <label class="label" [for]="id">{{ label() }}</label>
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      @if (icono()) {
        <vt-icon matPrefix class="prefijo" [name]="icono()" [size]="22" />
      }
      @if (multilinea()) {
        <textarea
          matInput
          [id]="id"
          rows="4"
          [attr.maxlength]="maxLength()"
          [placeholder]="placeholder()"
          [value]="valor()"
          [disabled]="deshabilitado()"
          [errorStateMatcher]="conError"
          (input)="escribir($any($event.target).value)"
          (blur)="alTocar()"
        ></textarea>
      } @else {
        <input
          matInput
          [id]="id"
          [type]="tipo()"
          [attr.maxlength]="maxLength()"
          [attr.autocomplete]="autocomplete()"
          [placeholder]="placeholder()"
          [value]="valor()"
          [disabled]="deshabilitado()"
          [errorStateMatcher]="conError"
          (input)="escribir($any($event.target).value)"
          (blur)="alTocar()"
        />
      }
      <span matSuffix><ng-content select="[sufijo]" /></span>
      @if (error(); as e) {
        <mat-error><vt-icon name="error" [filled]="true" [size]="16" />{{ e }}</mat-error>
      } @else if (ayuda()) {
        <mat-hint>{{ ayuda() }}</mat-hint>
      }
    </mat-form-field>
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
    mat-form-field {
      width: 100%;
      --mat-form-field-container-height: 52px;
      --mat-form-field-container-vertical-padding: 14px;
      --mat-form-field-outlined-outline-width: 1.5px;
      --mat-form-field-outlined-focus-outline-width: 2px;
      --mat-form-field-outlined-outline-color: var(--line-strong);
      --mat-form-field-outlined-hover-outline-color: var(--ink);
      --mat-form-field-outlined-focus-outline-color: var(--ink);
      --mat-form-field-outlined-error-outline-color: var(--danger);
      --mat-form-field-outlined-error-hover-outline-color: var(--danger);
      --mat-form-field-outlined-error-focus-outline-color: var(--danger);
      --mat-form-field-error-text-color: var(--danger);
      --mat-form-field-subscript-text-color: var(--ink-muted);
      --mat-form-field-subscript-text-font: var(--font-sans);
      --mat-form-field-subscript-text-size: 12px;
      --mat-form-field-subscript-text-weight: 500;
      --mat-form-field-outlined-container-shape: var(--radius-md);
      --mat-form-field-container-text-font: var(--font-sans);
      --mat-form-field-container-text-size: 15px;
      --mat-form-field-container-text-weight: 500;
      --mat-form-field-outlined-input-text-color: var(--ink);
      --mat-form-field-outlined-input-text-placeholder-color: var(--ink-muted);
      --mat-form-field-outlined-caret-color: var(--brand);
    }
    :host ::ng-deep .mat-mdc-text-field-wrapper {
      background: var(--surface);
      border-radius: var(--radius-md);
    }
    :host ::ng-deep .mat-mdc-form-field-subscript-wrapper .mat-mdc-form-field-error-wrapper,
    :host ::ng-deep .mat-mdc-form-field-subscript-wrapper .mat-mdc-form-field-hint-wrapper {
      padding: 0 4px;
    }
    :host ::ng-deep .mat-mdc-form-field-error {
      display: flex;
      align-items: flex-start;
      gap: 4px;
      font: var(--text-label);
    }
    .prefijo {
      margin-left: 16px;
      margin-right: 10px;
      color: var(--ink-muted);
    }
    [matSuffix] {
      display: inline-flex;
      padding-right: var(--space-1);
    }
    [matSuffix]:empty {
      display: none;
    }
  `,
})
export class TextField implements ControlValueAccessor {
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
  protected readonly deshabilitado = signal(false);

  /** El campo está en error cuando quien lo usa le pasa un mensaje. */
  protected readonly conError: ErrorStateMatcher = { isErrorState: () => !!this.error() };

  private readonly entrada = viewChild(MatInput);

  constructor() {
    // MatInput solo revisa el error por sí mismo cuando tiene un control de formulario; aquí se le avisa.
    effect(() => {
      this.error();
      this.entrada()?.updateErrorState();
    });
  }

  private alCambiar: (valor: string) => void = () => {};
  protected alTocar: () => void = () => {};

  protected escribir(valor: string): void {
    this.valor.set(valor);
    this.alCambiar(valor);
  }

  writeValue(valor: string | null): void {
    this.valor.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }
}
