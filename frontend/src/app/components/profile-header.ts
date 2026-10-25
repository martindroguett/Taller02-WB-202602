import { Component, computed, inject, input } from '@angular/core';
import { CatalogoService } from '../services/catalogo.service';
import { compacto } from '../models/format';
import { Pieza, Usuario } from '../models/vitrina';
import { Avatar } from './avatar';
import { Button } from './button';
import { RouterLink } from '@angular/router';
import { FollowButton } from './follow-button';
import { PieceArt } from './piece-art';

@Component({
  selector: 'vt-profile-header',
  imports: [Avatar, Button, FollowButton, PieceArt, RouterLink],
  template: `
    <div class="abanico" aria-hidden="true">
      @for (p of abanico(); track p.id; let i = $index) {
        <span
          class="carta vt-c-{{ p.categoria }}"
          [style.--giro.deg]="giros[i]"
          [style.--x.px]="i * 46"
        >
          @if (p.imagen_url) {
            <img [src]="p.imagen_url" alt="" />
          } @else {
            <vt-piece-art [categoria]="p.categoria" />
          }
        </span>
      }
    </div>
    <div class="vitrina vt-showcase"></div>
    <div class="cuerpo">
      <vt-avatar
        class="avatar"
        [nombre]="usuario().nombre"
        [tam]="88"
        [anillo]="esMio() ? 'brand' : 'none'"
      />
      <div class="acciones">
        @if (esMio()) {
          <a vt-button variant="accent" size="sm" icon="add" routerLink="/coleccion/nueva"
            >Agregar pieza</a
          >
        } @else {
          <vt-follow-button [usuarioId]="usuario().id" />
        }
      </div>
      <div class="quien">
        <h1 class="title">{{ usuario().nombre }}</h1>
        <p class="catalog usuario">&#64;{{ usuario().usuario }}</p>
        <p class="body bio">{{ usuario().bio }}</p>
      </div>
      <dl class="cifras">
        <div>
          <dt class="caption vt-muted">Piezas</dt>
          <dd class="stat">{{ compacto(piezas()) }}</dd>
        </div>
        <div>
          <dt class="caption vt-muted">Seguidores</dt>
          <dd class="stat">{{ compacto(seguidores()) }}</dd>
        </div>
        <div>
          <dt class="caption vt-muted">Siguiendo</dt>
          <dd class="stat">
            {{ compacto(esMio() ? catalogo.seguidos().length : usuario().siguiendo) }}
          </dd>
        </div>
      </dl>
    </div>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      margin-top: 38px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
    }
    .vitrina {
      height: 112px;
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    }
    .abanico {
      position: absolute;
      z-index: 2;
      top: -30px;
      right: var(--space-5);
      width: 150px;
      height: 120px;
    }
    .carta {
      position: absolute;
      top: 0;
      left: var(--x);
      width: 66px;
      height: 88px;
      overflow: hidden;
      border: 3px solid var(--on-night);
      border-radius: var(--radius-md);
      background: var(--c-soft);
      box-shadow: var(--shadow-pop);
      transform: rotate(var(--giro));
    }
    .carta img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .carta vt-piece-art {
      width: 100%;
      height: 100%;
    }
    .cuerpo {
      position: relative;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--space-4);
      padding: 0 var(--space-5) var(--space-5);
    }
    .avatar {
      margin-top: -44px;
      grid-row: 1;
    }
    .acciones {
      grid-row: 1;
      justify-self: end;
      align-self: center;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding-top: var(--space-3);
    }
    .quien {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .usuario {
      color: var(--ink-muted);
      text-transform: none;
    }
    .bio {
      margin-top: var(--space-2);
    }
    .cifras {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      margin: 0;
      padding: var(--space-3) 0 0;
      border-top: 1px solid var(--line);
    }
    .cifras div {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .cifras div + div {
      border-left: 1px solid var(--line);
    }
    dt {
      order: 2;
    }
    dd {
      margin: 0;
    }
  `,
})
export class ProfileHeader {
  protected readonly catalogo = inject(CatalogoService);
  protected readonly compacto = compacto;
  protected readonly giros = [-10, 4, 12];

  readonly usuario = input.required<Usuario>();
  readonly esMio = input(false);

  protected readonly abanico = computed<Pieza[]>(() =>
    this.catalogo.piezasDe(this.usuario().id).slice(0, 3),
  );
  protected readonly piezas = computed(() => this.catalogo.piezasDe(this.usuario().id).length);
  protected readonly seguidores = computed(() => this.catalogo.seguidores(this.usuario()));
}
