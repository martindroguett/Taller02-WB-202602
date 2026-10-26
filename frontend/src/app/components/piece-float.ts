import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../services/catalogo.service';
import { Pieza } from '../models/vitrina';
import { Avatar } from './avatar';
import { Button } from './button';
import { CatalogTag } from './catalog-tag';
import { LikeButton } from './like-button';
import { PieceArt } from './piece-art';

@Component({
  selector: 'vt-piece-float',
  imports: [RouterLink, Avatar, Button, CatalogTag, LikeButton, PieceArt],
  host: { '[class]': '"vt-c-" + pieza().categoria' },
  template: `
    <article>
      <div class="foto">
        @if (pieza().imagen_url && !fallo()) {
          <img [src]="pieza().imagen_url" alt="" (error)="fallo.set(true)" />
        } @else {
          <vt-piece-art [categoria]="pieza().categoria" />
        }
        <vt-catalog-tag class="ficha" [categoria]="pieza().categoria" [numero]="pieza().numero" />
      </div>
      <h3 class="title">{{ pieza().nombre }}</h3>
      <a class="dueno" [routerLink]="['/perfil', dueno().username]">
        <vt-avatar [nombre]="dueno().username" [tam]="32" />
        <span class="caption">&#64;{{ dueno().username }}</span>
      </a>
      <div class="fila">
        <vt-like-button [pieza]="pieza()" />
        <a vt-button variant="primary" size="sm" [routerLink]="['/pieza', pieza().id]">Ver pieza</a>
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
      padding: 4px;
    }
    article {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-3) var(--space-5);
      border-radius: var(--radius-xl);
      background: var(--surface);
      box-shadow: var(--shadow-pop);
      transform: rotate(2deg);
    }
    .foto {
      position: relative;
      aspect-ratio: 5 / 4;
      overflow: hidden;
      border-radius: var(--radius-lg);
      background: var(--c-soft);
    }
    .foto img,
    .foto vt-piece-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .ficha {
      position: absolute;
      top: var(--space-3);
      left: var(--space-3);
    }
    h3 {
      padding: 0 var(--space-2);
    }
    .dueno {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0 var(--space-2);
      min-height: var(--tap-target);
    }
    .fila {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      padding: 0 var(--space-1);
    }
  `,
})
export class PieceFloat {
  private readonly catalogo = inject(CatalogoService);
  readonly pieza = input.required<Pieza>();
  protected readonly fallo = signal(false);
  protected readonly dueno = computed(() => this.catalogo.usuario(this.pieza().duenoId));
}
