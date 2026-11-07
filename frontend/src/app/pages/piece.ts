import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { ConfirmSheet } from '../components/confirm-sheet';
import { AuthService } from '../services/auth.service';
import { CatalogTag } from '../components/catalog-tag';
import { Comments } from '../components/comments';
import { EmptyState } from '../components/empty-state';
import { LikeButton } from '../components/like-button';
import { IconButton } from '../components/icon-button';
import { Icon } from '../components/icon';
import { PieceArt } from '../components/piece-art';
import { compacto, relativo } from '../models/format';
import { categoriaDe } from '../models/vitrina';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import { ComentariosService } from '../services/comentarios.service';
import { Pantalla } from '../services/pantalla';
import { PieceDetail } from '../components/piece-detail';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'vt-piece-page',
  imports: [
    Avatar,
    Button,
    CatalogTag,
    Comments,
    ConfirmSheet,
    EmptyState,
    Icon,
    IconButton,
    LikeButton,
    PieceArt,
    PieceDetail,
    RouterLink,
  ],
  template: `
    @if (pieza.hasValue()) {
      @let p = pieza.value();
      @if (pantalla.escritorio()) {
        <div class="escritorio"><vt-piece-detail [pieza]="p" modo="pagina" /></div>
      } @else {
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
            @if (p.megusta || p.guardados) {
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
            }
            <div class="dueno">
              <a class="persona" [routerLink]="['/coleccionistas', p.dueno.username]">
                <vt-avatar [nombre]="p.dueno.username" [tam]="52" />
                <span class="body-strong">&#64;{{ p.dueno.username }}</span>
              </a>
              <a vt-button variant="secondary" [routerLink]="['/coleccionistas', p.dueno.username]"
                >Ver perfil</a
              >
            </div>
            <vt-comments #comentarios [piezaId]="p.id" [duenoId]="p.dueno.id" />
            <p class="caption vt-muted">
              Las acciones sociales de la pieza están pendientes de conexión.
            </p>
            @if (auth.usuario()?.id === p.dueno.id) {
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
                  [disabled]="eliminando()"
                  (click)="errorEliminar.set(''); confirmando.set(true)"
                >
                  Eliminar
                </button>
              </div>
              @if (errorEliminar()) {
                <p role="alert">{{ errorEliminar() }}</p>
              }
              <vt-confirm-sheet
                [categoria]="p.categoria"
                [abierto]="confirmando()"
                [pendiente]="eliminando()"
                [error]="errorEliminar()"
                titulo="¿Eliminar esta pieza?"
                [texto]="'Vas a quitar «' + p.nombre + '» de tu colección. No se puede deshacer.'"
                (cancelado)="confirmando.set(false)"
                (confirmado)="eliminar()"
              />
            }
          </article>
          <div class="accion-fija">
            <vt-like-button [pieza]="p" />
            <button
              type="button"
              vt-button
              variant="secondary"
              icon="chat_bubble"
              [attr.aria-label]="'Comentarios: ' + comentariosTotal()"
              (click)="comentarios.abrir()"
            >
              {{ comentariosTotal() }}
            </button>
            <button
              type="button"
              vt-button
              class="compartir"
              variant="secondary"
              icon="link"
              (click)="compartir()"
            >
              Compartir
            </button>
          </div>
        </div>
      }
    } @else if (pieza.isLoading()) {
      <div class="detalle" aria-hidden="true">
        <div class="vt-esqueleto cuadrado"></div>
        <div class="cargando-texto">
          <div class="vt-esqueleto linea titulo"></div>
          <div class="vt-esqueleto linea"></div>
          <div class="vt-esqueleto linea corta"></div>
        </div>
      </div>
      <p class="vt-sr-only" role="status">Cargando pieza…</p>
    } @else if (falloCarga()) {
      <div class="vt-screen">
        <vt-empty-state
          titulo="No pudimos cargar la pieza"
          texto="Comprueba tu conexión e inténtalo de nuevo."
          ><button type="button" vt-button (click)="pieza.reload()">
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
    /* Desde 1000 px la página ocupa toda la pantalla: foto a un lado y comentarios al otro. */
    .escritorio {
      height: 100dvh;
      padding: var(--space-4);
    }
    .detalle {
      max-width: 720px;
      margin-inline: auto;
      padding-bottom: 110px;
    }
    .cargando-texto {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-6) var(--space-5);
    }
    .cargando-texto .titulo {
      height: 32px;
      width: 70%;
    }
    .cargando-texto .corta {
      width: 45%;
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
  protected readonly auth = inject(AuthService);
  protected readonly pantalla = inject(Pantalla);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastService);
  private readonly destroy = inject(DestroyRef);
  readonly id = input<string>();
  protected readonly pieza = this.api.detalle(this.id);
  protected readonly falloCarga = computed(
    () => !!this.pieza.error() && (this.pieza.error() as HttpErrorResponse).status !== 404,
  );
  protected readonly fallo = linkedSignal(() => {
    this.id();
    return false;
  });
  protected readonly confirmando = signal(false);
  protected readonly eliminando = signal(false);
  protected readonly errorEliminar = signal('');
  protected readonly comentariosTotal = inject(ComentariosService).total;
  protected readonly categoriaDe = categoriaDe;
  protected readonly compacto = compacto;
  protected pendiente(accion: string): void {
    this.toast.show(`${accion} está pendiente de conectar`);
  }

  protected eliminar(): void {
    if (!this.pieza.hasValue() || this.eliminando()) return;
    const p = this.pieza.value();
    this.eliminando.set(true);
    this.errorEliminar.set('');
    this.api
      .eliminar(p.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.eliminando.set(false);
          this.confirmando.set(false);
          this.toast.show('Pieza eliminada', 'success');
          void this.router.navigate(['/coleccionistas', p.dueno.username]);
        },
        error: (e: HttpErrorResponse) => {
          this.eliminando.set(false);
          this.errorEliminar.set(
            e.status === 403
              ? 'Solo el dueño puede eliminar esta pieza.'
              : e.status === 404
                ? 'Esta pieza ya no está disponible.'
                : 'No pudimos eliminar la pieza. Inténtalo de nuevo.',
          );
        },
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
    // En el teléfono se abre el menú de compartir del sistema; si no existe o se falla, se copia el enlace.
    if (typeof navigator.share === 'function' && this.pieza.hasValue()) {
      try {
        await navigator.share({ title: this.pieza.value().nombre, url: window.location.href });
        return;
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') return;
      }
    }
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
