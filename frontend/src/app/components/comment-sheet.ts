import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { relativo } from '../models/format';
import { AuthService } from '../services/auth.service';
import { DetalleDialogo } from '../services/detalle-dialogo';
import {
  ComentarioLocal,
  ComentariosService,
  MAX_COMENTARIO,
} from '../services/comentarios.service';
import { Avatar } from './avatar';
import { Button } from './button';
import { EmptyState } from './empty-state';
import { Icon } from './icon';
import { IconButton } from './icon-button';

export interface DatosHoja {
  duenoId: number;
}

@Component({
  selector: 'vt-comment-sheet',
  imports: [Avatar, Button, EmptyState, Icon, IconButton, NgTemplateOutlet, ReactiveFormsModule],
  template: `
    <header>
      <h2 class="title" id="comentarios-titulo">
        Comentarios <span class="total">{{ comentarios.total() }}</span>
      </h2>
      @if (!enLinea()) {
        <button
          type="button"
          vt-icon-button
          tone="sunken"
          icon="close"
          label="Cerrar comentarios"
          (click)="ref?.dismiss()"
        ></button>
      }
    </header>

    <div #lista class="lista" role="log" aria-live="polite" aria-labelledby="comentarios-titulo">
      @for (h of comentarios.hilos(); track h.raiz.id) {
        <ng-container [ngTemplateOutlet]="fila" [ngTemplateOutletContext]="{ $implicit: h.raiz }" />
        @for (r of h.respuestas; track r.id) {
          <div class="respuesta">
            <ng-container [ngTemplateOutlet]="fila" [ngTemplateOutletContext]="{ $implicit: r }" />
          </div>
        }
      } @empty {
        @if (comentarios.cargando()) {
          @for (i of esqueleto; track i) {
            <div class="esqueleto" aria-hidden="true"></div>
          }
        } @else if (comentarios.error()) {
          <vt-empty-state
            titulo="No pudimos cargar los comentarios"
            texto="Comprueba tu conexión e inténtalo de nuevo."
          >
            <button type="button" vt-button variant="secondary" (click)="reintentarCarga()">
              Reintentar
            </button>
          </vt-empty-state>
        } @else {
          <vt-empty-state
            titulo="Aún no hay comentarios"
            texto="Cuenta qué te gusta de esta pieza."
          />
        }
      }
      @if (comentarios.quedanPorCargar && !comentarios.cargando()) {
        <button type="button" vt-button variant="secondary" (click)="comentarios.cargarMas()">
          Ver más comentarios
        </button>
      }
    </div>

    <ng-template #fila let-c>
      <article [class.pendiente]="c.estado === 'enviando'">
        <vt-avatar [nombre]="c.autor.username" [tam]="36" />
        <div class="cuerpo">
          <p class="quien">
            <strong>&#64;{{ c.autor.username }}</strong>
            @if (c.autor.id === duenoId()) {
              <span class="dueno">Dueño</span>
            }
            <span class="caption vt-muted">· {{ cuando(c) }}</span>
            @if (c.estado === 'error') {
              <span class="fallo">· No se pudo enviar</span>
            }
          </p>
          <p class="texto">{{ c.texto }}</p>
          <div class="acciones">
            @if (c.estado === 'error') {
              <button type="button" class="enlace fallo" (click)="comentarios.reintentar(c)">
                Reintentar
              </button>
              <button type="button" class="enlace" (click)="comentarios.eliminar(c)">
                Eliminar
              </button>
            } @else if (!c.estado) {
              <button type="button" class="enlace" (click)="responder(c)">Responder</button>
              @if (puedeEliminar(c)) {
                <button
                  type="button"
                  class="enlace"
                  [attr.aria-label]="'Eliminar comentario de @' + c.autor.username"
                  (click)="comentarios.eliminar(c)"
                >
                  Eliminar
                </button>
              }
              <button
                type="button"
                class="enlace corazon"
                [class.on]="c.gustado"
                [attr.aria-pressed]="c.gustado"
                [attr.aria-label]="'Me gusta: ' + c.megusta"
                (click)="meGusta(c)"
              >
                <vt-icon name="favorite" [filled]="c.gustado" [size]="18" />
                @if (c.megusta > 0) {
                  {{ c.megusta }}
                }
              </button>
            }
          </div>
        </div>
      </article>
    </ng-template>

    <footer>
      @if (auth.usuario(); as yo) {
        @if (respondiendo(); as r) {
          <p class="respondiendo">
            Respondiendo a <strong>&#64;{{ r.autor.username }}</strong>
            <button
              type="button"
              class="enlace"
              aria-label="Cancelar respuesta"
              (click)="respondiendo.set(null)"
            >
              <vt-icon name="close" [size]="18" />
            </button>
          </p>
        }
        <form (submit)="enviar($event, yo.id, yo.username)">
          <vt-avatar [nombre]="yo.username" [tam]="36" />
          <div class="campo" [class.largo]="restantes() < 50">
            <textarea
              #campo
              rows="1"
              aria-label="Escribe un comentario"
              [placeholder]="respondiendo() ? 'Escribe tu respuesta…' : 'Escribe un comentario…'"
              [maxLength]="max"
              [formControl]="texto"
              (keydown.control.enter)="enviar($event, yo.id, yo.username)"
              (keydown.meta.enter)="enviar($event, yo.id, yo.username)"
            ></textarea>
            @if (restantes() < 50) {
              <span class="contador caption" [class.limite]="restantes() < 10">{{
                restantes()
              }}</span>
            }
          </div>
          <button
            type="submit"
            class="enviar"
            aria-label="Enviar comentario"
            [disabled]="!texto.value.trim()"
          >
            <vt-icon name="arrow_forward" [size]="22" />
          </button>
        </form>
      } @else {
        <button type="button" vt-button [block]="true" (click)="ingresar()">
          Ingresa para comentar
        </button>
      }
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-4) var(--space-2) var(--space-5);
    }
    .total {
      color: var(--ink-muted);
      font: var(--text-label);
      letter-spacing: 0;
    }
    .lista {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-2) var(--space-5) var(--space-4);
    }
    article {
      display: flex;
      gap: var(--space-3);
    }
    article.pendiente {
      opacity: 0.65;
    }
    .cuerpo {
      min-width: 0;
      flex: 1;
    }
    .quien {
      font: var(--text-caption);
      font-size: 13px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0 6px;
    }
    .dueno {
      padding: 1px 8px;
      border-radius: var(--radius-pill);
      background: var(--brand-soft);
      color: var(--brand);
      font-size: 11px;
      font-weight: 700;
    }
    .fallo {
      color: var(--danger);
      font-weight: 700;
    }
    .texto {
      margin-top: 2px;
      font: var(--text-body);
      font-size: 14px;
      line-height: 20px;
      overflow-wrap: anywhere;
      white-space: pre-line;
    }
    .acciones {
      display: flex;
      gap: var(--space-2);
    }
    .enlace {
      min-height: 44px;
      padding: 0 4px;
      border: 0;
      background: transparent;
      color: var(--ink-muted);
      font: var(--text-label);
      cursor: pointer;
    }
    .enlace.fallo {
      color: var(--danger);
    }
    .respuesta {
      margin-left: 48px;
      margin-top: calc(var(--space-2) * -1);
    }
    .corazon {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      min-width: 44px;
      justify-content: center;
    }
    .corazon.on {
      color: var(--like);
    }
    .respondiendo {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-2);
      padding-left: var(--space-2);
      font: var(--text-caption);
      font-size: 13px;
      color: var(--ink-muted);
    }
    .esqueleto {
      height: 56px;
      border-radius: var(--radius-md);
      background: var(--surface-sunken);
    }
    @media (prefers-reduced-motion: no-preference) {
      .esqueleto {
        animation: pulso 1.4s ease-in-out infinite;
      }
      @keyframes pulso {
        50% {
          opacity: 0.5;
        }
      }
    }
    footer {
      padding: var(--space-3) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom));
      border-top: 1px solid var(--line);
    }
    form {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }
    .campo {
      position: relative;
      flex: 1;
      min-width: 0;
      border: 1.5px solid var(--line-strong);
      border-radius: 22px;
      background: var(--surface-sunken);
    }
    .campo:focus-within {
      border-color: var(--brand);
      background: var(--surface);
    }
    textarea {
      display: block;
      width: 100%;
      min-height: 41px;
      max-height: 120px;
      padding: 9px 16px;
      border: 0;
      outline: none;
      resize: none;
      background: transparent;
      color: var(--ink);
      font: var(--text-body);
      field-sizing: content;
    }
    textarea::placeholder {
      color: var(--ink-muted);
      opacity: 1;
    }
    .campo.largo textarea {
      padding-right: 44px;
    }
    .contador {
      position: absolute;
      right: 14px;
      bottom: 11px;
      color: var(--ink-muted);
    }
    .contador.limite {
      color: var(--danger);
      font-weight: 700;
    }
    .enviar {
      display: grid;
      place-items: center;
      flex: none;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 50%;
      background: var(--brand);
      color: var(--on-brand);
      box-shadow: var(--shadow-brand);
      cursor: pointer;
    }
    .enviar:disabled {
      background: var(--line);
      color: var(--ink-muted);
      box-shadow: none;
      cursor: default;
    }
  `,
})
export class CommentSheet {
  protected readonly comentarios = inject(ComentariosService);
  protected readonly auth = inject(AuthService);
  /** En la hoja inferior (móvil) los datos llegan por MAT_BOTTOM_SHEET_DATA; en escritorio se usa en línea con inputs. */
  private readonly datos = inject<DatosHoja>(MAT_BOTTOM_SHEET_DATA, { optional: true });
  protected readonly ref = inject<MatBottomSheetRef<CommentSheet>>(MatBottomSheetRef, {
    optional: true,
  });
  readonly duenoIdEntrada = input<number>(undefined, { alias: 'duenoId' });
  readonly enLinea = input(false);
  protected readonly duenoId = computed(() => this.duenoIdEntrada() ?? this.datos?.duenoId ?? -1);
  private readonly router = inject(Router);
  private readonly detalle = inject(DetalleDialogo);
  private readonly lista = viewChild<ElementRef<HTMLElement>>('lista');
  private readonly campo = viewChild<ElementRef<HTMLTextAreaElement>>('campo');
  protected readonly respondiendo = signal<ComentarioLocal | null>(null);

  protected readonly max = MAX_COMENTARIO;
  protected readonly esqueleto = [1, 2, 3];
  protected readonly texto = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(MAX_COMENTARIO)],
  });
  private readonly largo = signal(0);
  protected readonly restantes = computed(() => MAX_COMENTARIO - this.largo());

  constructor() {
    this.texto.valueChanges.subscribe((v) => this.largo.set(v.length));
  }

  protected cuando(c: ComentarioLocal): string {
    return relativo(Math.max(0, Math.floor((Date.now() - Date.parse(c.creado_en)) / 60_000)));
  }

  protected puedeEliminar(c: ComentarioLocal): boolean {
    const yo = this.auth.usuario()?.id;
    return yo !== undefined && (c.autor.id === yo || this.duenoId() === yo);
  }

  protected enviar(evento: Event, id: number, username: string): void {
    evento.preventDefault();
    const valor = this.texto.value.trim();
    if (!valor) return;
    this.comentarios.enviar(valor, { id, username }, this.respondiendo()?.id);
    this.texto.reset('');
    this.respondiendo.set(null);
    // El comentario nuevo queda al final: se baja la lista para que se vea.
    setTimeout(() => {
      const lista = this.lista()?.nativeElement;
      if (lista) lista.scrollTop = lista.scrollHeight;
    });
  }

  protected responder(c: ComentarioLocal): void {
    if (!this.auth.usuario()) return this.ingresar();
    this.respondiendo.set(c);
    setTimeout(() => this.campo()?.nativeElement.focus());
  }

  protected meGusta(c: ComentarioLocal): void {
    if (!this.auth.usuario()) return this.ingresar();
    this.comentarios.alternarMeGusta(c);
  }

  protected reintentarCarga(): void {
    this.comentarios.cargar(this.comentarios.piezaActual);
  }

  protected ingresar(): void {
    this.ref?.dismiss();
    void this.router.navigate(['/ingresar'], { queryParams: this.detalle.destinoParaIngresar() });
  }
}
