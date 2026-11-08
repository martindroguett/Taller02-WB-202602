import { Component, computed, ElementRef, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InteraccionesService } from '../services/interacciones.service';
import { compacto, relativo } from '../models/format';
import { DetalleDialogo } from '../services/detalle-dialogo';
import { PiezaPublica } from '../services/catalogo-publico.service';
import { IconButton } from './icon-button';
import { Icon } from './icon';
import { PieceArt } from './piece-art';
import { Avatar } from './avatar';
import { CatalogTag } from './catalog-tag';

@Component({
  selector: 'vt-piece-card',
  imports: [RouterLink, IconButton, Icon, PieceArt, Avatar, CatalogTag],
  host: {
    '[class]': '"vt-c-" + pieza().categoria',
    '[attr.data-pieza]': 'pieza().id',
  },
  template: `
    <article class="tarjeta">
      <div class="imagen">
        <a
          class="enlace"
          [routerLink]="detalleLink()"
          [attr.aria-label]="'Ver ' + pieza().nombre"
        >
          @if (pieza().imagen_url && !fallo()) {
            <img [src]="pieza().imagen_url" alt="" loading="lazy" (error)="fallo.set(true)" />
          } @else {
            <vt-piece-art [categoria]="pieza().categoria" />
          }
        </a>
        <vt-catalog-tag
          class="catalogo"
          [categoria]="pieza().categoria"
          [numero]="numero()"
          [compacta]="true"
        />
        <button
          type="button"
          vt-icon-button
          class="guardar"
          tone="glass"
          size="sm"
          icon="bookmark"
          [label]="guardada() ? 'Quitar de favoritos' : 'Guardar en favoritos'"
          [active]="guardada()"
          [pressed]="guardada()"
          (click)="alternarGuardar()"
        ></button>
      </div>
      <div class="info">
        <a class="nombre" [routerLink]="detalleLink()">{{ pieza().nombre }}</a>
        <p class="meta caption">
          <a class="dueno publico" [routerLink]="['/coleccionistas', dueno().username]">
            <vt-avatar [nombre]="dueno().username" [tam]="24" />
            <span>&#64;{{ dueno().username }}</span>
          </a>
          @if (megusta() !== '0') {
            <span class="dato" [class.gustado]="gustada()"
              ><vt-icon name="favorite" [size]="16" [filled]="gustada()" />{{ megusta() }}</span
            >
          }
          <span class="fecha">{{ cuando() }}</span>
        </p>
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .tarjeta {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 8px 8px var(--space-3);
      gap: var(--space-2);
      border: 1px solid transparent;
      border-radius: var(--radius-lg);
      background: var(--surface);
      box-shadow: var(--shadow-card);
    }
    .imagen {
      position: relative;
      border-radius: 16px;
    }
    .enlace {
      display: block;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 16px;
      background: var(--c-soft);
    }
    img,
    vt-piece-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .imagen .guardar {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
    }
    img {
      outline: 1px solid oklch(0 0 0 / 0.1);
      outline-offset: -1px;
    }
    .catalogo {
      position: absolute;
      top: 10px;
      left: 10px;
      max-width: calc(100% - 60px);
    }
    .info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 var(--space-2);
      min-width: 0;
      flex: 1;
    }
    .nombre {
      font: var(--text-piece-name);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .meta {
      color: var(--ink-muted);
      display: flex;
      align-items: center;
      gap: 2px var(--space-2);
      margin-top: auto;
    }
    .dueno {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      flex: 1;
    }
    .dueno span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dato {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      white-space: nowrap;
    }
    .dato.gustado {
      color: var(--like);
    }
    @media (max-width: 420px) {
      /* En la grilla de dos columnas la ficha pasa abajo, para no chocar con el marcador. */
      .catalogo {
        top: auto;
        bottom: 8px;
        left: 8px;
        max-width: calc(100% - 16px);
      }
      /* En la grilla la meta queda en una sola fila: usuario y me gusta. La fecha se ve en el detalle. */
      .fecha {
        display: none;
      }
    }
  `,
})
export class PieceCard {
  constructor() {
    // En escritorio la pieza se abre en una ventana sobre la lista. Se escucha en la fase de captura
    // para frenar el enlace antes de que el router navegue; con Ctrl o Cmd sigue el enlace normal.
    inject<ElementRef<HTMLElement>>(ElementRef, { optional: true })?.nativeElement.addEventListener(
      'click',
      (evento) => {
        const enlace = (evento.target as Element).closest('a.enlace, a.nombre');
        if (!enlace) return;
        if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey) return;
        if (this.detalle.abrir(this.pieza().id, this.ids())) {
          evento.preventDefault();
          evento.stopPropagation();
        }
      },
      true,
    );
  }
  readonly pieza = input.required<PiezaPublica>();
  readonly ids = input<number[]>();
  protected readonly fallo = linkedSignal(() => {
    this.pieza().imagen_url;
    return false;
  });
  private readonly detalle = inject(DetalleDialogo);
  private readonly interacciones = inject(InteraccionesService);
  protected readonly guardada = computed(() => this.interacciones.estado(this.pieza()).guardada);
  protected readonly gustada = computed(() => this.interacciones.estado(this.pieza()).gustada);
  protected alternarGuardar(): void {
    this.interacciones.alternarGuardado(this.pieza());
  }
  protected readonly detalleLink = computed(() => ['/pieza', this.pieza().id]);
  protected readonly dueno = computed(() => this.pieza().dueno);
  protected readonly numero = computed(() => this.pieza().id);
  protected readonly megusta = computed(() => compacto(this.interacciones.estado(this.pieza()).megusta));
  protected readonly cuando = computed(() =>
    relativo(Math.max(0, Math.floor((Date.now() - Date.parse(this.pieza().creado_en)) / 60_000))),
  );
}
