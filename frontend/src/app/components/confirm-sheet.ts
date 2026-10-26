import { Component, ElementRef, afterRenderEffect, input, output, viewChild } from '@angular/core';
import { Button } from './button';
import { PieceArt } from './piece-art';
import { CategoriaSlug } from '../models/vitrina';

@Component({
  selector: 'vt-confirm-sheet',
  imports: [Button, PieceArt],
  template: `
    <dialog
      #dialogo
      aria-labelledby="confirm-titulo"
      aria-describedby="confirm-texto"
      (cancel)="$event.preventDefault(); cancelado.emit()"
      (click)="$event.target === dialogo && cancelado.emit()"
    >
      <vt-piece-art class="pieza" [categoria]="categoria()" [bare]="true" />
      <section class="contenido">
        <h2 class="title" id="confirm-titulo">{{ titulo() }}</h2>
        <p class="vt-muted" id="confirm-texto">{{ texto() }}</p>
        <div class="botones">
          <button type="button" vt-button variant="secondary" autofocus (click)="cancelado.emit()">
            Cancelar
          </button>
          <button
            type="button"
            vt-button
            variant="destructive"
            icon="delete"
            (click)="confirmado.emit()"
          >
            Eliminar pieza
          </button>
        </div>
      </section>
    </dialog>
  `,
  styles: `
    dialog {
      padding: 0;
      margin: auto auto 0;
      inset: auto 0 0;
      overflow: visible;
      width: min(100%, 480px);
      max-height: calc(100dvh - 32px);
      border: 1px solid transparent;
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      background: var(--surface);
      color: var(--ink);
      box-shadow: var(--shadow-float);
      overscroll-behavior: contain;
    }
    dialog::backdrop {
      background: rgb(21 23 43 / 55%);
    }
    .contenido {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: 72px var(--space-5) var(--space-6);
      max-height: calc(100dvh - 80px);
      overflow-y: auto;
      overscroll-behavior: contain;
    }
    .pieza {
      position: absolute;
      top: -48px;
      left: var(--space-5);
      width: 112px;
      height: 112px;
      transform: rotate(-8deg);
      filter: drop-shadow(0 8px 12px rgb(0 0 0 / 18%));
    }
    .botones {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-3);
    }
    .botones > * {
      flex: 1;
    }
  `,
})
export class ConfirmSheet {
  readonly categoria = input<CategoriaSlug>('cartas');
  readonly abierto = input(false);
  readonly titulo = input.required<string>();
  readonly texto = input.required<string>();
  readonly confirmado = output<void>();
  readonly cancelado = output<void>();
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    // El diálogo nativo mantiene el foco dentro y bloquea la interacción con el fondo.
    afterRenderEffect(() => {
      const dialogo = this.dialogo().nativeElement;
      if (this.abierto() && !dialogo.open) dialogo.showModal();
      else if (!this.abierto() && dialogo.open) dialogo.close();
    });
  }
}
