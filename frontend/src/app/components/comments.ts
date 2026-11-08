import { Component, effect, inject, input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { relativo } from '../models/format';
import { ComentarioLocal, ComentariosService } from '../services/comentarios.service';
import { Avatar } from './avatar';
import { CommentSheet, DatosHoja } from './comment-sheet';

/** Resumen de comentarios en el detalle de la pieza. «abrir()» muestra la hoja con la conversación. */
@Component({
  selector: 'vt-comments',
  imports: [Avatar],
  exportAs: 'comentarios',
  template: `
    <section aria-labelledby="comentarios-resumen">
      <div class="cabecera">
        <h2 class="title" id="comentarios-resumen">Comentarios</h2>
        @if (comentarios.total() > 0) {
          <button type="button" class="ver" (click)="abrir()">
            Ver los {{ comentarios.total() }}
          </button>
        }
      </div>
      @for (c of recientes(); track c.id) {
        <article>
          <vt-avatar [nombre]="c.autor.username" [tam]="36" />
          <div>
            <p class="quien">
              <strong>&#64;{{ c.autor.username }}</strong>
              <span class="vt-muted"> · {{ cuando(c) }}</span>
            </p>
            <p class="texto">{{ c.texto }}</p>
          </div>
        </article>
      } @empty {
        @if (!comentarios.cargando() && !comentarios.error()) {
          <p class="vt-muted vacio">Aún no hay comentarios. Cuenta qué te gusta de esta pieza.</p>
        }
      }
      <button type="button" class="escribir" (click)="abrir()">Escribe un comentario…</button>
    </section>
  `,
  styles: `
    section {
      margin-top: var(--space-2);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .cabecera {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }
    .ver {
      min-height: var(--tap-target);
      padding: 0 4px;
      border: 0;
      background: transparent;
      color: var(--brand);
      font: var(--text-label);
      cursor: pointer;
    }
    article {
      display: flex;
      gap: var(--space-3);
    }
    .quien {
      font-size: 13px;
    }
    .texto {
      font-size: 14px;
      line-height: 20px;
      overflow-wrap: anywhere;
      white-space: pre-line;
    }
    .vacio {
      font-size: 14px;
    }
    .escribir {
      min-height: var(--tap-target);
      padding: 0 16px;
      border: 1.5px solid var(--line-strong);
      border-radius: var(--radius-pill);
      background: var(--surface-sunken);
      color: var(--ink-muted);
      font: var(--text-body);
      text-align: left;
      cursor: pointer;
    }
  `,
})
export class Comments {
  protected readonly comentarios = inject(ComentariosService);
  private readonly hoja = inject(MatBottomSheet);

  readonly piezaId = input.required<number>();
  readonly duenoId = input.required<number>();

  constructor() {
    effect(() => this.comentarios.cargar(this.piezaId()));
  }

  protected recientes(): ComentarioLocal[] {
    return this.comentarios.items().slice(-2);
  }

  protected cuando(c: ComentarioLocal): string {
    return relativo(Math.max(0, Math.floor((Date.now() - Date.parse(c.creado_en)) / 60_000)));
  }

  abrir(): void {
    this.hoja.open<CommentSheet, DatosHoja>(CommentSheet, {
      data: { duenoId: this.duenoId() },
      panelClass: 'vt-hoja',
      ariaLabel: 'Comentarios',
    });
  }
}
