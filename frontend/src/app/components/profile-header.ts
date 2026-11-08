import { Component, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { compacto } from '../models/format';
import { PiezaPublica } from '../services/catalogo-publico.service';
import { UsuarioPublico } from '../services/usuarios-publicos.service';
import { Avatar } from './avatar';
import { Button } from './button';
import { PieceArt } from './piece-art';
import { abrirListaUsuarios } from './user-list-dialog';

@Component({
  selector: 'vt-profile-header',
  imports: [Avatar, Button, PieceArt, RouterLink],
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
      <vt-avatar class="avatar" [nombre]="usuario().username" [tam]="88" anillo="brand" />
      <div class="acciones">
        <a vt-button variant="accent" size="sm" icon="add" routerLink="/coleccion/nueva"
          >Agregar pieza</a
        >
      </div>
      <div class="quien">
        <h1 class="title">&#64;{{ usuario().username }}</h1>
        @if (usuario().bio) {
          <p class="body bio">{{ usuario().bio }}</p>
        }
      </div>
      <div class="cifras">
        <button type="button" (click)="verPiezas.emit()">
          <span class="stat">{{ piezas() === null ? '—' : compacto(piezas()!) }}</span>
          <span class="caption vt-muted">Piezas</span>
        </button>
        <button type="button" (click)="verLista('seguidores')">
          <span class="stat">{{ compacto(usuario().seguidores) }}</span>
          <span class="caption vt-muted">Seguidores</span>
        </button>
        <button type="button" (click)="verLista('seguidos')">
          <span class="stat">{{ compacto(usuario().siguiendo) }}</span>
          <span class="caption vt-muted">Siguiendo</span>
        </button>
      </div>
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
    .bio {
      margin-top: var(--space-2);
    }
    .cifras {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      padding: var(--space-3) 0 0;
      border-top: 1px solid var(--line);
    }
    .cifras button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-height: var(--tap-target);
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
    }
    .cifras button + button {
      border-left: 1px solid var(--line);
    }
  `,
})
export class ProfileHeader {
  protected readonly compacto = compacto;
  protected readonly giros = [-10, 4, 12];

  readonly usuario = input.required<UsuarioPublico>();
  readonly piezas = input<number | null>(null);
  readonly abanico = input<PiezaPublica[]>([]);
  /** Se pulsa «Piezas»: la página lleva a la colección. */
  readonly verPiezas = output<void>();

  private readonly dialogo = inject(MatDialog);

  protected verLista(tipo: 'seguidores' | 'seguidos'): void {
    abrirListaUsuarios(this.dialogo, this.usuario().username, tipo);
  }
}
