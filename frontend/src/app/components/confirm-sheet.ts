import {
  Component,
  TemplateRef,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Button } from './button';
import { PieceArt } from './piece-art';
import { CategoriaSlug } from '../models/vitrina';

/** Confirmación en una hoja inferior, con el MatDialog de Angular Material. */
@Component({
  selector: 'vt-confirm-sheet',
  imports: [Button, MatDialogModule, PieceArt],
  template: `
    <ng-template #plantilla>
      <vt-piece-art class="pieza" [categoria]="categoria()" [bare]="true" />
      <section class="contenido">
        <h2 class="title" id="confirm-titulo">{{ titulo() }}</h2>
        <p class="vt-muted" id="confirm-texto">{{ texto() }}</p>
        @if (error()) {
          <p role="alert">{{ error() }}</p>
        }
        <div class="botones">
          <button
            type="button"
            vt-button
            variant="secondary"
            cdkFocusInitial
            [disabled]="pendiente()"
            (click)="cancelado.emit()"
          >
            Cancelar
          </button>
          <button
            type="button"
            vt-button
            variant="destructive"
            icon="delete"
            [disabled]="pendiente()"
            (click)="confirmado.emit()"
          >
            {{ pendiente() ? 'Eliminando…' : 'Eliminar pieza' }}
          </button>
        </div>
      </section>
    </ng-template>
  `,
  styles: `
    :host {
      display: none;
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
  readonly pendiente = input(false);
  readonly error = input('');
  readonly titulo = input.required<string>();
  readonly texto = input.required<string>();
  readonly confirmado = output<void>();
  readonly cancelado = output<void>();
  private readonly plantilla = viewChild.required<TemplateRef<unknown>>('plantilla');
  private readonly dialogo = inject(MatDialog);
  private ref?: MatDialogRef<unknown>;

  constructor() {
    effect(() => {
      if (this.abierto()) untracked(() => this.abrir());
      else this.ref?.close();
    });
    // Mientras se elimina no se puede cerrar con Escape ni tocando fuera.
    effect(() => {
      if (this.ref) this.ref.disableClose = this.pendiente();
    });
  }

  private abrir(): void {
    if (this.ref) return;
    const ref = this.dialogo.open(this.plantilla(), {
      panelClass: 'vt-dialogo',
      position: { bottom: '0' },
      width: 'min(100%, 480px)',
      maxWidth: '100vw',
      ariaLabelledBy: 'confirm-titulo',
      ariaDescribedBy: 'confirm-texto',
      disableClose: this.pendiente(),
    });
    this.ref = ref;
    ref.afterClosed().subscribe(() => {
      this.ref = undefined;
      // Si se cerró con Escape o tocando fuera, se le avisa a quien lo abrió.
      if (this.abierto()) this.cancelado.emit();
    });
  }
}
