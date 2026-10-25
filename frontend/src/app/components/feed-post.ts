import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../services/catalogo.service';
import { relativo } from '../models/format';
import { Pieza } from '../models/vitrina';
import { Avatar } from './avatar';
import { CatalogTag } from './catalog-tag';
import { Icon } from './icon';
import { LikeButton } from './like-button';
import { PieceArt } from './piece-art';

@Component({
  selector: 'vt-feed-post',
  imports: [RouterLink, Avatar, CatalogTag, Icon, LikeButton, PieceArt],
  host: { '[class]': '"vt-c-" + pieza().categoria' },
  template: `
    <article>
      <header>
        <a class="autor" [routerLink]="['/perfil', autor().username]">
          <vt-avatar [nombre]="autor().username" [tam]="44" />
          <span class="quien">
            <span class="body-strong">&#64;{{ autor().username }}</span>
            <span class="caption vt-muted">Compartió una pieza · {{ cuando() }}</span>
          </span>
        </a>
      </header>
      <p class="texto">{{ pieza().descripcion }}</p>
      <div class="media">
        <a
          class="foto"
          [routerLink]="['/pieza', pieza().id]"
          [attr.aria-label]="'Ver ' + pieza().nombre"
        >
          @if (pieza().imagen_url && !fallo()) {
            <img [src]="pieza().imagen_url" alt="" loading="lazy" (error)="fallo.set(true)" />
          } @else {
            <vt-piece-art [categoria]="pieza().categoria" />
          }
          <span class="placa">
            <vt-catalog-tag [categoria]="pieza().categoria" [numero]="pieza().numero" />
            <span class="nombre">{{ pieza().nombre }}</span>
          </span>
        </a>
      </div>
      <footer>
        <vt-like-button [pieza]="pieza()" />
        <button
          type="button"
          class="accion"
          [class.guardada]="guardada()"
          [attr.aria-label]="guardada() ? 'Quitar de favoritos' : 'Guardar en favoritos'"
          [attr.aria-pressed]="guardada()"
          (click)="catalogo.toggleGuardar(pieza().id)"
        >
          <vt-icon name="bookmark" [filled]="guardada()" [size]="20" />{{
            guardada() ? 'Guardada' : 'Guardar'
          }}
        </button>
        <button
          type="button"
          class="accion compartir"
          aria-label="Compartir enlace"
          (click)="catalogo.compartir(pieza().id)"
        >
          <vt-icon name="link" [size]="20" /><span class="compartir-label">Compartir</span>
        </button>
      </footer>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }
    article {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
    }
    .autor {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: var(--tap-target);
    }
    .quien {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .foto {
      position: relative;
      display: block;
      aspect-ratio: 1;
      border-radius: 16px;
      overflow: hidden;
      background: var(--c-soft);
    }
    .foto img,
    .foto vt-piece-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .foto img {
      outline: 1px solid oklch(0 0 0 / 0.1);
      outline-offset: -1px;
    }
    .placa {
      position: absolute;
      left: var(--space-3);
      right: var(--space-3);
      bottom: var(--space-3);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
      padding: 12px 14px;
      border-radius: var(--radius-md);
      background: var(--glass);
      color: var(--ink);
    }
    .placa vt-catalog-tag {
      background: transparent;
      box-shadow: none;
      padding: 0;
    }
    .nombre {
      font: var(--text-body-strong);
    }
    .media {
      position: relative;
    }
    .texto {
      padding-inline: 2px;
      line-height: 1.65;
    }
    footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .accion {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-height: 44px;
      padding: 0 10px;
      border: 1px solid transparent;
      border-radius: var(--radius-pill);
      font: var(--text-label);
      cursor: pointer;
      white-space: nowrap;
      background: var(--surface-sunken);
      color: var(--ink);
    }
    @media (prefers-reduced-motion: no-preference) {
      .accion {
        transition: transform 150ms ease-out;
      }
      .accion:active {
        transform: scale(0.96);
      }
    }
    .accion.guardada {
      color: var(--brand);
      background: var(--brand-soft);
    }
    @media (max-width: 360px) {
      article {
        padding: 12px;
        border-radius: 28px;
      }
      .accion {
        padding-inline: 10px;
      }
      .compartir {
        width: 44px;
      }
      .compartir-label {
        display: none;
      }
    }
  `,
})
export class FeedPost {
  protected readonly catalogo = inject(CatalogoService);

  readonly pieza = input.required<Pieza>();
  protected readonly fallo = signal(false);
  protected readonly autor = computed(() => this.catalogo.usuario(this.pieza().duenoId));
  protected readonly guardada = computed(() => this.catalogo.guardadas().has(this.pieza().id));
  protected readonly cuando = computed(() => relativo(this.pieza().hace));
}
