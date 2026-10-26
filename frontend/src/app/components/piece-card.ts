import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../services/catalogo.service';
import { compacto, relativo } from '../models/format';
import { Pieza } from '../models/vitrina';
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
    <article class="tarjeta" [class.destacada]="pieza().destacada && variante() === 'grid'">
      <div class="imagen">
        <a
          class="enlace"
          [routerLink]="['/pieza', pieza().id]"
          [attr.aria-label]="'Ver ' + pieza().nombre"
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
            [numero]="pieza().numero"
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
            (click)="catalogo.toggleGuardar(pieza().id)"
          ></button>
        }
      </div>
      <div class="info">
        @if (pieza().destacada && variante() === 'grid') {
          <span class="insignia"><vt-icon name="star" [filled]="true" [size]="14" />Destacada</span>
        }
        <a class="nombre" [routerLink]="['/pieza', pieza().id]">{{ pieza().nombre }}</a>
        <p class="meta caption">
          <a class="dueno" [routerLink]="['/perfil', dueno().username]">
            @if (variante() === 'grid') {
              <vt-avatar [nombre]="dueno().username" [tam]="24" />
            }
            <span>&#64;{{ dueno().username }}</span></a
          >
          <span class="dato" [class.gustado]="catalogo.gustadas().has(pieza().id)"
            ><vt-icon
              name="favorite"
              [size]="16"
              [filled]="catalogo.gustadas().has(pieza().id)"
            />{{ megusta() }}</span
          >
          @if (variante() === 'row') {
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
      .catalogo {
        display: none;
      }
      .meta {
        flex-wrap: wrap;
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
  readonly pieza = input.required<Pieza>();
  readonly variante = input<'grid' | 'row'>('grid');
  protected readonly fallo = signal(false);
  protected readonly guardada = computed(() => this.catalogo.guardadas().has(this.pieza().id));
  protected readonly dueno = computed(() => this.catalogo.usuario(this.pieza().duenoId));
  protected readonly megusta = computed(() => compacto(this.catalogo.megusta(this.pieza())));
  protected readonly cuando = computed(() => relativo(this.pieza().hace));
}
