import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../services/catalogo.service';
import { relativo } from '../models/format';
import { Pieza } from '../models/vitrina';
import { Avatar } from './avatar';
import { CatalogTag } from './catalog-tag';
import { IconButton } from './icon-button';
import { LikeButton } from './like-button';
import { PieceArt } from './piece-art';

@Component({
  selector: 'vt-feed-post',
  imports: [RouterLink, Avatar, CatalogTag, IconButton, LikeButton, PieceArt],
  host: { '[class]': '"vt-c-" + pieza().categoria' },
  template: `
    <article>
      <header>
        <a class="autor" [routerLink]="['/perfil', autor().username]">
          <vt-avatar [nombre]="autor().username" [tam]="44" />
          <span class="quien">
            <span class="body-strong">&#64;{{ autor().username }}</span>
            <span class="caption vt-muted">{{ cuando() }}</span>
          </span>
        </a>
      </header>
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
          <span class="placa title">{{ pieza().nombre }}</span>
        </a>
        <vt-catalog-tag class="ficha" [categoria]="pieza().categoria" [numero]="pieza().numero" />
      </div>
      <p class="texto">{{ pieza().descripcion }}</p>
      <footer>
        <vt-like-button [pieza]="pieza()" />
        <span class="espacio"></span>
        <button
          type="button"
          vt-icon-button
          icon="bookmark"
          [label]="guardada() ? 'Quitar de favoritos' : 'Guardar en favoritos'"
          [active]="guardada()"
          [pressed]="guardada()"
          (click)="catalogo.toggleGuardar(pieza().id)"
        ></button>
        <button
          type="button"
          vt-icon-button
          icon="link"
          label="Compartir enlace"
          (click)="catalogo.compartir(pieza().id)"
        ></button>
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
      padding: var(--space-3);
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
      aspect-ratio: 5 / 4;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--c-soft);
    }
    .foto img,
    .foto vt-piece-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placa {
      position: absolute;
      left: var(--space-3);
      right: var(--space-3);
      top: var(--space-3);
      width: fit-content;
      max-width: calc(100% - 2 * var(--space-3));
      padding: 6px 14px;
      border-radius: var(--radius-md);
      background: var(--glass);
      color: var(--ink);
      font-size: 15px;
      line-height: 20px;
    }
    .media {
      position: relative;
    }
    .ficha {
      position: absolute;
      left: var(--space-5);
      bottom: 0;
      transform: translateY(50%);
    }
    .texto {
      padding: var(--space-3) var(--space-2) 0;
    }
    footer {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    .espacio {
      flex: 1;
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
