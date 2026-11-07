import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { CatalogoService } from '../services/catalogo.service';
import { compacto, relativo } from '../models/format';
import { Pieza } from '../models/vitrina';
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
    '[attr.data-variante]': 'variante()',
  },
  template: `
    <article class="tarjeta" [class.destacada]="destacada() && variante() === 'grid'">
      <div class="imagen">
        <a
          class="enlace"
          [routerLink]="detalleLink()"
          [attr.aria-label]="esPublica() ? 'Ver ' + pieza().nombre : null"
        >
          @if (pieza().imagen_url && !fallo()) {
            <img [src]="pieza().imagen_url" alt="" loading="lazy" (error)="fallo.set(true)" />
          } @else {
            <vt-piece-art [categoria]="pieza().categoria" />
          }
        </a>
        @if (variante() === 'grid') {
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
            [label]="
              (esPublica() ? 'Pendiente de conectar: ' : '') +
              (guardada() ? 'Quitar de favoritos' : 'Guardar en favoritos')
            "
            [title]="esPublica() ? 'Pendiente de conectar' : ''"
            [active]="guardada()"
            [pressed]="guardada()"
            (click)="alternarGuardar()"
          ></button>
        }
      </div>
      <div class="info">
        @if (destacada() && variante() === 'grid') {
          <span class="insignia"><vt-icon name="star" [filled]="true" [size]="14" />Destacada</span>
        }
        <a class="nombre" [routerLink]="detalleLink()">{{ pieza().nombre }}</a>
        <p class="meta caption">
          @if (esPublica()) {
            <span class="dueno publico" title="Perfil pendiente de conectar">
              <vt-avatar [nombre]="dueno().username" [tam]="24" />
              <span>&#64;{{ dueno().username }}</span>
            </span>
            @if (megusta() !== '0') {
              <span class="dato" [class.gustado]="gustada()"
                ><vt-icon name="favorite" [size]="16" [filled]="gustada()" />{{ megusta() }}</span
              >
            }
            <span class="fecha">{{ cuando() }}</span>
          } @else {
            <a class="dueno" [routerLink]="['/perfil', dueno().username]">
              @if (variante() === 'grid') {
                <vt-avatar [nombre]="dueno().username" [tam]="24" />
              }
              <span>&#64;{{ dueno().username }}</span>
            </a>
            @if (megusta() !== '0') {
              <span class="dato" [class.gustado]="catalogo.gustadas().has(pieza().id)"
                ><vt-icon
                  name="favorite"
                  [size]="16"
                  [filled]="catalogo.gustadas().has(pieza().id)"
                />{{ megusta() }}</span
              >
            }
          }
          @if (variante() === 'row' && !esPublica()) {
            <span>{{ cuando() }}</span>
          }
        </p>
      </div>
      <div class="acciones"><ng-content /></div>
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
    .tarjeta.destacada {
      border-color: var(--spark);
      box-shadow:
        0 0 0 1px var(--spark),
        0 8px 24px rgb(255 90 60 / 12%);
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
      :host(:not([data-variante='row'])) .fecha {
        display: none;
      }
      :host([data-variante='row']) .meta {
        flex-wrap: wrap;
      }
      :host([data-variante='row']) .meta > .dueno.publico {
        flex-basis: 100%;
      }
    }
    .insignia {
      width: fit-content;
      padding: 2px 6px;
      border-radius: var(--radius-pill);
      background: var(--spark);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font: var(--text-caption);
      color: var(--ink);
    }
    .insignia vt-icon {
      color: var(--ink);
    }
    .acciones:empty {
      display: none;
    }
    :host([data-variante='row']) .tarjeta {
      flex-direction: row;
      align-items: center;
      border-radius: var(--radius-md);
      padding: 6px;
    }
    :host([data-variante='row']) .imagen {
      padding: 4px;
      width: 76px;
      flex: none;
    }
    :host([data-variante='row']) .enlace {
      border-radius: var(--radius-sm);
    }
    :host([data-variante='row']) .acciones {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      width: 44px;
      flex: none;
    }
    @media (min-width: 400px) {
      :host([data-variante='row']) .acciones {
        width: auto;
        flex-wrap: nowrap;
      }
    }
  `,
})
export class PieceCard {
  protected readonly catalogo = inject(CatalogoService);
  readonly pieza = input.required<Pieza | PiezaPublica>();
  readonly variante = input<'grid' | 'row'>('grid');
  protected readonly fallo = linkedSignal(() => {
    this.pieza().imagen_url;
    return false;
  });
  private readonly toast = inject(ToastService);
  protected readonly guardada = computed(() => {
    const p = this.pieza();
    return 'dueno' in p ? p.guardada : this.catalogo.guardadas().has(p.id);
  });
  protected readonly gustada = computed(() => {
    const p = this.pieza();
    return 'dueno' in p ? p.gustada : this.catalogo.gustadas().has(p.id);
  });
  protected alternarGuardar(): void {
    const p = this.pieza();
    if ('dueno' in p) this.toast.show('Favoritos está pendiente de conectar');
    else this.catalogo.toggleGuardar(p.id);
  }
  protected readonly esPublica = computed(() => 'dueno' in this.pieza());
  protected readonly detalleLink = computed(() =>
    this.esPublica() ? ['/pieza', this.pieza().id] : null,
  );
  protected readonly dueno = computed(() => {
    const p = this.pieza();
    return 'dueno' in p ? p.dueno : this.catalogo.usuario(p.duenoId);
  });
  protected readonly destacada = computed(() => {
    const p = this.pieza();
    return 'dueno' in p ? false : !!p.destacada;
  });
  protected readonly numero = computed(() => {
    const p = this.pieza();
    return 'dueno' in p ? p.id : p.numero;
  });
  protected readonly megusta = computed(() => {
    const p = this.pieza();
    return compacto('dueno' in p ? p.megusta : this.catalogo.megusta(p));
  });
  protected readonly cuando = computed(() => {
    const p = this.pieza();
    return relativo(
      'dueno' in p
        ? Math.max(0, Math.floor((Date.now() - Date.parse(p.creado_en)) / 60_000))
        : p.hace,
    );
  });
}
