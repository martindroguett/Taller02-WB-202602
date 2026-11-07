import { Component, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { FeedPost } from '../components/feed-post';
import { Icon } from '../components/icon';
import { IconButton } from '../components/icon-button';
import { TopBar } from '../components/top-bar';
import { AuthService } from '../services/auth.service';
import { InteraccionesService } from '../services/interacciones.service';
import { UsuariosPublicosService } from '../services/usuarios-publicos.service';

const POR_PAGINA = 20;

@Component({
  selector: 'vt-feed-page',
  imports: [
    Avatar,
    Button,
    EmptyState,
    FeedPost,
    Icon,
    IconButton,
    MatProgressSpinnerModule,
    RouterLink,
    TopBar,
  ],
  template: `
    <main class="vt-screen feed">
      <vt-top-bar titulo="Feed" [subtitulo]="subtitulo()">
        <a vt-icon-button tone="surface" icon="search" label="Buscar piezas" routerLink="/"></a>
        <a routerLink="/perfil" aria-label="Ir a tu perfil"
          ><vt-avatar [nombre]="yo()?.username ?? ''" anillo="brand" [tam]="40"
        /></a>
      </vt-top-bar>
      <section class="vt-section" aria-label="Coleccionistas que sigues">
        <div class="vt-rail">
          <a class="persona" routerLink="/coleccion/nueva">
            <span class="nueva"><vt-icon name="add" [size]="30" /></span>
            <span class="caption">Tu pieza</span>
          </a>
          @for (u of seguidos.value()?.items ?? []; track u.id) {
            <a class="persona" [routerLink]="['/coleccionistas', u.username]">
              <vt-avatar [nombre]="u.username" anillo="brand" [tam]="52" />
              <span class="caption">{{ u.username }}</span>
            </a>
          }
        </div>
      </section>
      @if (feed.isLoading()) {
        <div class="cargando" role="status"><mat-spinner diameter="28" /> Cargando tu Feed…</div>
      } @else if (feed.error()) {
        <vt-empty-state
          titulo="No pudimos cargar tu Feed"
          texto="Comprueba tu conexión e inténtalo de nuevo."
        >
          <button vt-button type="button" (click)="feed.reload()">Reintentar</button>
        </vt-empty-state>
      } @else if (feed.value(); as pagina) {
        @for (p of pagina.items; track p.id) {
          <vt-feed-post [pieza]="p" />
        } @empty {
          <vt-empty-state
            titulo="Tu Feed está esperando"
            texto="Sigue a otros coleccionistas para ver sus piezas aquí."
          >
            <a vt-button routerLink="/">Descubrir coleccionistas</a>
          </vt-empty-state>
        }
        @if (pagina.total > porPagina || desplazamiento() > 0) {
          <nav class="paginacion" aria-label="Páginas del Feed">
            <button
              vt-button
              variant="secondary"
              type="button"
              [disabled]="desplazamiento() === 0"
              (click)="irA(desplazamiento() - porPagina)"
            >
              Anterior
            </button>
            <span>Página {{ desplazamiento() / porPagina + 1 }}</span>
            <button
              vt-button
              variant="secondary"
              type="button"
              [disabled]="desplazamiento() + porPagina >= pagina.total"
              (click)="irA(desplazamiento() + porPagina)"
            >
              Siguiente
            </button>
          </nav>
        }
      }
    </main>
  `,
  styles: `
    .feed {
      max-width: 640px;
      gap: 24px;
    }
    .persona {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      width: 88px;
      padding: 10px 4px 4px;
    }
    .persona .caption {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .nueva {
      display: grid;
      place-items: center;
      width: 52px;
      height: 52px;
      border-radius: 18px;
      background: var(--brand);
      color: var(--on-brand);
    }
    .cargando,
    .paginacion {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-block: var(--space-4);
    }
    .paginacion {
      justify-content: center;
      flex-wrap: wrap;
    }
  `,
})
export class FeedPage {
  private readonly auth = inject(AuthService);
  private readonly interacciones = inject(InteraccionesService);
  private readonly usuarios = inject(UsuariosPublicosService);

  protected readonly porPagina = POR_PAGINA;
  protected readonly yo = this.auth.usuario;
  protected readonly desplazamiento = signal(0);
  // Los dos httpResource se piden solos y se vuelven a pedir si cambia la página o el usuario.
  protected readonly feed = this.interacciones.feed(this.desplazamiento);
  protected readonly seguidos = this.usuarios.seguidos(() => this.yo()?.username ?? '');

  protected readonly subtitulo = computed(() => {
    const total = this.seguidos.value()?.total;
    if (total === undefined) return '';
    return total === 1 ? 'Sigues a 1 coleccionista' : `Sigues a ${total} coleccionistas`;
  });

  protected irA(desplazamiento: number): void {
    this.desplazamiento.set(desplazamiento);
    window.scrollTo({ top: 0 });
  }
}
