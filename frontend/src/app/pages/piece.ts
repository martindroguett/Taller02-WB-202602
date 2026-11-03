import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, of, catchError, map, startWith, Subject } from 'rxjs';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { CatalogTag } from '../components/catalog-tag';
import { EmptyState } from '../components/empty-state';
import { LikeButton } from '../components/like-button';
import { FollowButton } from '../components/follow-button';
import { IconButton } from '../components/icon-button';
import { Icon } from '../components/icon';
import { PieceArt } from '../components/piece-art';
import { compacto, relativo } from '../models/format';
import { categoriaDe } from '../models/vitrina';
import { CatalogoPublicoService, PiezaPublica } from '../services/catalogo-publico.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'vt-piece-page',
  imports: [
    Avatar,
    Button,
    CatalogTag,
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
              [label]="
                (p.guardada ? 'Quitar de favoritos' : 'Guardar en favoritos') +
                ': pendiente de conectar'
              "
              [active]="p.guardada"
              [pressed]="p.guardada"
              title="Pendiente de conectar"
              (click)="pendiente('Favoritos')"
            ></button>
          </div>
        </div>
        <article class="hoja">
          <vt-catalog-tag class="ficha" [categoria]="p.categoria" [numero]="p.id" />
          <h1 class="display-lg nombre">{{ p.nombre }}</h1>
          <p class="categoria caption">
            <vt-icon [name]="categoriaDe(p.categoria).icono" [size]="16" />{{
              categoriaDe(p.categoria).nombre
            }}
            · {{ cuando(p.creado_en) }}
          </p>
          <p class="body">{{ p.descripcion }}</p>
          <dl class="cifras">
            <div>
              <dd class="stat">{{ compacto(p.megusta) }}</dd>
              <dt class="caption vt-muted">Me gusta</dt>
            </div>
            <div>
              <dd class="stat">{{ compacto(p.guardados) }}</dd>
              <dt class="caption vt-muted">Favoritos</dt>
            </div>
          </dl>
          <div class="dueno">
            <span class="persona" title="Perfil pendiente de conectar">
              <vt-avatar [nombre]="p.dueno.username" [tam]="52" />
              <span class="body-strong">&#64;{{ p.dueno.username }}</span>
            </span>
            <vt-follow-button [usuarioId]="p.dueno.id" [pendiente]="true" />
          </div>
          <p class="caption vt-muted">
            El perfil y las acciones sociales están pendientes de conexión.
          </p>
          <div>
            <p class="caption vt-muted">Gestión de pieza: vista previa, pendiente de sesión</p>
            <div class="gestion">
              <button
                type="button"
                vt-button
                variant="secondary"
                icon="edit"
                disabled
                title="Pendiente de conectar la sesión"
              >
                Editar pieza
              </button>
              <button
                type="button"
                vt-button
                variant="danger"
                icon="delete"
                disabled
                title="Pendiente de conectar la sesión"
              >
                Eliminar
              </button>
            </div>
          </div>
        </article>
        <div class="accion-fija">
          <vt-like-button [pieza]="p" />
          <button
            type="button"
            vt-button
            class="compartir"
            variant="secondary"
            icon="link"
            (click)="compartir()"
          >
            Compartir enlace
          </button>
        </div>
      </div>
    } @else if (estado() === 'cargando') {
      <div class="vt-screen"><p role="status">Cargando pieza…</p></div>
    } @else if (estado() === 'error') {
      <div class="vt-screen">
        <vt-empty-state
          titulo="No pudimos cargar la pieza"
          texto="Comprueba tu conexión e inténtalo de nuevo."
          ><button type="button" vt-button (click)="reintentar.next()">
            Reintentar
          </button></vt-empty-state
        >
      </div>
    } @else {
      <div class="vt-screen">
        <vt-empty-state
          titulo="Esta pieza no está disponible"
          texto="Puede que la hayan eliminado o que el enlace esté incompleto."
          ><a vt-button routerLink="/">Volver a Explorar</a></vt-empty-state
        >
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
    .persona .body-strong {
      min-width: 0;
      overflow-wrap: anywhere;
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
  private readonly api = inject(CatalogoPublicoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);
  private readonly destroy = inject(DestroyRef);
  protected readonly pieza = signal<PiezaPublica | null>(null);
  protected readonly estado = signal<'cargando' | 'error' | 'no-encontrada'>('cargando');
  protected readonly fallo = signal(false);
  protected readonly reintentar = new Subject<void>();
  protected readonly categoriaDe = categoriaDe;
  protected readonly compacto = compacto;
  protected pendiente(accion: string): void {
    this.toast.show(`${accion} está pendiente de conectar`);
  }

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) =>
          this.reintentar.pipe(
            startWith(undefined),
            switchMap(() => {
              this.pieza.set(null);
              this.fallo.set(false);
              this.estado.set('cargando');
              const valor = params.get('id') ?? '';
              if (!/^[1-9]\d*$/.test(valor) || !Number.isSafeInteger(Number(valor)))
                return of({ tipo: 'no-encontrada' as const });
              return this.api.obtener(Number(valor)).pipe(
                map((pieza) => ({ tipo: 'pieza' as const, pieza })),
                catchError((e: HttpErrorResponse) =>
                  of({ tipo: e.status === 404 ? ('no-encontrada' as const) : ('error' as const) }),
                ),
              );
            }),
          ),
        ),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe((resultado) => {
        if (resultado.tipo === 'pieza') this.pieza.set(resultado.pieza);
        else this.estado.set(resultado.tipo);
      });
  }
  protected cuando(fecha: string): string {
    return relativo(Math.max(0, Math.floor((Date.now() - Date.parse(fecha)) / 60_000)));
  }
  protected volver(): void {
    if (window.history.state?.navigationId > 1) this.location.back();
    else void this.router.navigateByUrl('/');
  }
  protected async compartir(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.toast.show('Enlace copiado', 'success');
    } catch {
      this.toast.show(
        'No pudimos copiar el enlace: cópialo desde la barra del navegador.',
        'danger',
      );
    }
  }
}
