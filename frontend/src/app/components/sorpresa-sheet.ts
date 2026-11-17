import {
  Component,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { categoriaDe } from '../models/vitrina';
import { numeroCatalogo } from '../models/format';
import { PiezaPublica } from '../services/catalogo-publico.service';
import { Button } from './button';
import { PieceArt } from './piece-art';

/**
 * «Te tocó…»: la pieza al azar aparece en una hoja inferior en vez de saltar a otra pantalla.
 * Se puede sacudir el celular otra vez para que salga otra, o abrirla.
 */
@Component({
  selector: 'vt-sorpresa-sheet',
  imports: [Button, MatDialogModule, PieceArt],
  template: `
    <ng-template #plantilla>
      @let p = pieza();
      @if (p) {
        <section class="contenido" [class]="'vt-c-' + p.categoria">
          @for (actual of [p]; track actual.id) {
            <div class="foto">
              @if (p.imagen_url) {
                <img [src]="p.imagen_url" alt="" />
              } @else {
                <vt-piece-art [categoria]="p.categoria" />
              }
            </div>
          }
          <p class="catalog etiqueta">Te tocó · {{ ficha() }}</p>
          <h2 class="title" id="sorpresa-titulo">{{ p.nombre }}</h2>
          <p class="caption vt-muted">&#64;{{ p.dueno.username }} · {{ categoria() }}</p>
          <div class="botones">
            <button
              type="button"
              vt-button
              variant="secondary"
              icon="shuffle"
              [disabled]="cargando()"
              (click)="otra.emit()"
            >
              {{ cargando() ? 'Buscando…' : 'Otra' }}
            </button>
            <button type="button" vt-button variant="accent" cdkFocusInitial (click)="ver.emit()">
              Ver pieza
            </button>
          </div>
          @if (consejo()) {
            <p class="caption vt-muted consejo">{{ consejo() }}</p>
          }
        </section>
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: none;
    }
    .contenido {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-6) var(--space-5) var(--space-6);
      max-height: calc(100dvh - 80px);
      overflow-y: auto;
      text-align: center;
    }
    .foto {
      width: 172px;
      height: 172px;
      margin-bottom: var(--space-3);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--c-soft);
      box-shadow: var(--shadow-float);
      transform: rotate(-3deg);
      animation: aparecer 520ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .foto img,
    .foto vt-piece-art {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .etiqueta {
      color: var(--brand);
      text-transform: uppercase;
    }
    .title {
      overflow-wrap: anywhere;
    }
    .botones {
      display: flex;
      gap: var(--space-2);
      width: 100%;
      margin-top: var(--space-3);
    }
    .botones > * {
      flex: 1;
    }
    .consejo {
      margin-top: var(--space-1);
    }
    @keyframes aparecer {
      from {
        opacity: 0;
        transform: scale(0.6) rotate(-14deg);
      }
      to {
        opacity: 1;
        transform: scale(1) rotate(-3deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .foto {
        animation: none;
      }
    }
  `,
})
export class SorpresaSheet {
  /** La pieza que salió; con null la hoja se cierra. */
  readonly pieza = input<PiezaPublica | null>(null);
  readonly cargando = input(false);
  readonly consejo = input('');
  readonly ver = output<void>();
  readonly otra = output<void>();
  readonly cerrada = output<void>();
  protected readonly categoria = computed(() => {
    const p = this.pieza();
    return p ? categoriaDe(p.categoria).nombre : '';
  });
  protected readonly ficha = computed(() => {
    const p = this.pieza();
    return p ? numeroCatalogo(p.id) : '';
  });
  private readonly plantilla = viewChild.required<TemplateRef<unknown>>('plantilla');
  private readonly dialogo = inject(MatDialog);
  private ref?: MatDialogRef<unknown>;

  constructor() {
    effect(() => {
      if (this.pieza()) untracked(() => this.abrir());
      else this.ref?.close();
    });
  }

  private abrir(): void {
    if (this.ref) return;
    const ref = this.dialogo.open(this.plantilla(), {
      panelClass: 'vt-dialogo',
      position: { bottom: '0' },
      width: 'min(100%, 480px)',
      maxWidth: '100vw',
      ariaLabelledBy: 'sorpresa-titulo',
    });
    this.ref = ref;
    ref.afterClosed().subscribe(() => {
      this.ref = undefined;
      // Cerrada con Escape o tocando fuera: se le avisa a quien la abrió.
      if (this.pieza()) this.cerrada.emit();
    });
  }
}
