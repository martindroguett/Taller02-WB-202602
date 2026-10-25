import { Component, computed, inject, input, numberAttribute, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { CatalogTag } from '../components/catalog-tag';
import { ConfirmSheet } from '../components/confirm-sheet';
import { EmptyState } from '../components/empty-state';
import { FollowButton } from '../components/follow-button';
import { IconButton } from '../components/icon-button';
import { LikeButton } from '../components/like-button';
import { PieceArt } from '../components/piece-art';
import { CatalogoService } from '../services/catalogo.service';
import { ToastService } from '../services/toast.service';
import { compacto, relativo } from '../models/format';
import { categoriaDe } from '../models/vitrina';
import { Icon } from '../components/icon';
import { Location } from '@angular/common';

@Component({
  selector: 'vt-piece-page',
  imports: [
    Avatar,
    Button,
    CatalogTag,
    ConfirmSheet,
    EmptyState,
    FollowButton,
    Icon,
    IconButton,
    LikeButton,
    PieceArt,
    RouterLink,
  ],
  template: `
    @if (pieza(); as p) {
      <div class="detalle vt-c-{{ p.categoria }}">
        <div class="foto">
          @if (p.imagen_url && !fallo()) {
            <img [src]="p.imagen_url" alt="" (error)="fallo.set(true)" />
          } @else {
            <vt-piece-art [categoria]="p.categoria" />
          }
          <div class="barra">
            <button
              type="button"
              vt-icon-button
              tone="glass"
              icon="arrow_back"
              label="Volver"
              (click)="volver()"
            ></button>
            <button
              type="button"
              vt-icon-button
              tone="glass"
              icon="bookmark"
              [label]="guardada() ? 'Quitar de favoritos' : 'Guardar en favoritos'"
              [active]="guardada()"
              [pressed]="guardada()"
              (click)="catalogo.toggleGuardar(p.id)"
            ></button>
          </div>
        </div>

        <article class="hoja">
          <vt-catalog-tag class="ficha" [categoria]="p.categoria" [numero]="p.numero" />
          <h1 class="display-lg nombre">{{ p.nombre }}</h1>
          <p class="categoria caption">
            <vt-icon [name]="categoria().icono" [size]="16" />{{ categoria().nombre }} ·
            {{ cuando() }}
          </p>
          <p class="body">{{ p.descripcion }}</p>

          <dl class="cifras">
            <div>
              <dd class="stat">{{ compacto(catalogo.megusta(p)) }}</dd>
              <dt class="caption vt-muted">Me gusta</dt>
            </div>
            <div>
              <dd class="stat">{{ compacto(p.guardados + (guardada() ? 1 : 0)) }}</dd>
              <dt class="caption vt-muted">Favoritos</dt>
            </div>
          </dl>

          <div class="dueno">
            <a class="persona" [routerLink]="['/perfil', dueno().username]">
              <vt-avatar [nombre]="dueno().username" [tam]="52" />
              <span class="quien">
                <span class="body-strong">&#64;{{ dueno().username }}</span>
              </span>
            </a>
            @if (!esMia()) {
              <vt-follow-button [usuarioId]="dueno().id" />
            }
          </div>

          @if (esMia()) {
            <div class="gestion">
              <a
                vt-button
                variant="secondary"
                icon="edit"
                [routerLink]="['/coleccion', p.id, 'editar']"
                >Editar pieza</a
              >
              <button
                type="button"
                vt-button
                variant="danger"
                icon="delete"
                (click)="confirmando.set(true)"
              >
                Eliminar
              </button>
            </div>
          }
        </article>

        <div class="accion-fija">
          <vt-like-button [pieza]="p" />
          <button
            type="button"
            vt-button
            class="compartir"
            variant="secondary"
            icon="link"
            (click)="catalogo.compartir(p.id)"
          >
            Compartir enlace
          </button>
        </div>
      </div>

      <vt-confirm-sheet
        [categoria]="p.categoria"
        [abierto]="confirmando()"
        titulo="¿Eliminar esta pieza?"
        [texto]="'Vas a quitar «' + p.nombre + '» de tu colección. No se puede deshacer.'"
        (cancelado)="confirmando.set(false)"
        (confirmado)="eliminar(p.id)"
      />
    } @else {
      <div class="vt-screen">
        <vt-empty-state
          titulo="Esta pieza ya no está"
          texto="Puede que la hayan eliminado o que el enlace esté incompleto."
        >
          <a vt-button routerLink="/">Volver a Explorar</a>
        </vt-empty-state>
      </div>
    }
  `,
  styles: `
    .detalle {
      max-width: 720px;
      margin-inline: auto;
      padding-bottom: 110px;
    }
    .foto {
      position: relative;
      aspect-ratio: 1;
      background: var(--c-soft);
      overflow: hidden;
    }
    .foto img,
    .foto vt-piece-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .barra {
      position: absolute;
      top: var(--space-4);
      left: var(--space-4);
      right: var(--space-4);
      display: flex;
      justify-content: space-between;
    }
    .hoja {
      position: relative;
      margin-top: calc(var(--space-8) * -1);
      padding: var(--space-8) var(--space-5) var(--space-5);
      background: var(--surface);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .ficha {
      position: absolute;
      top: 0;
      left: var(--space-5);
      transform: translateY(-50%) rotate(-3deg);
    }
    .categoria {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--c-ink);
      font-weight: 700;
    }
    .cifras {
      display: flex;
      gap: var(--space-6);
      margin: 0;
      padding: var(--space-3) 0;
      border-block: 1px solid var(--line);
    }
    .cifras div {
      display: flex;
      flex-direction: column-reverse;
      gap: 2px;
    }
    .cifras dd {
      margin: 0;
    }
    .dueno {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    .persona {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-width: 0;
      min-height: var(--tap-target);
    }
    .quien {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .quien .catalog {
      text-transform: none;
      overflow-wrap: anywhere;
    }
    .gestion {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
    .accion-fija {
      position: fixed;
      z-index: 10;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4) calc(var(--space-3) + env(safe-area-inset-bottom));
      background: var(--surface);
      box-shadow: var(--shadow-float);
    }
    .compartir {
      flex: 1;
    }
    @media (min-width: 600px) {
      .detalle {
        padding-top: var(--space-6);
      }
      .foto {
        border-radius: var(--radius-xl);
        aspect-ratio: 5 / 4;
      }
      .hoja {
        border-radius: var(--radius-xl);
      }
      .accion-fija {
        max-width: 720px;
        left: 50%;
        right: auto;
        width: 100%;
        transform: translateX(-50%);
        border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      }
    }
  `,
})
export class PiecePage {
  protected readonly catalogo = inject(CatalogoService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly id = input.required<number, string>({ transform: numberAttribute });

  protected readonly compacto = compacto;
  protected readonly fallo = signal(false);
  protected readonly confirmando = signal(false);

  protected readonly pieza = computed(() => this.catalogo.pieza(this.id()));
  protected readonly dueno = computed(() => this.catalogo.usuario(this.pieza()!.duenoId));
  protected readonly categoria = computed(() => categoriaDe(this.pieza()!.categoria));
  protected readonly esMia = computed(() => this.pieza()?.duenoId === this.catalogo.yo.id);
  protected readonly guardada = computed(() => this.catalogo.guardadas().has(this.id()));
  protected readonly cuando = computed(() => relativo(this.pieza()!.hace));

  protected volver(): void {
    if (window.history.state?.navigationId > 1) this.location.back();
    else this.router.navigateByUrl('/');
  }

  protected eliminar(id: number): void {
    this.catalogo.eliminar(id);
    this.confirmando.set(false);
    this.toast.show('Pieza eliminada', 'success');
    this.router.navigateByUrl('/perfil');
  }
}
