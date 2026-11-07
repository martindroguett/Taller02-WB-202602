import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { ComunidadLateral } from '../components/comunidad-lateral';
import { EmptyState } from '../components/empty-state';
import { FeedPost } from '../components/feed-post';
import { Icon } from '../components/icon';
import { IconButton } from '../components/icon-button';
import { TopBar } from '../components/top-bar';
import { CatalogoService } from '../services/catalogo.service';

@Component({
  selector: 'vt-feed-page',
  imports: [
    Avatar,
    Button,
    ComunidadLateral,
    EmptyState,
    FeedPost,
    Icon,
    IconButton,
    RouterLink,
    TopBar,
  ],
  template: `
    <div class="vt-screen pagina">
      <main class="feed">
        <vt-top-bar
          titulo="Feed"
          [subtitulo]="'Sigues a ' + catalogo.seguidos().length + ' coleccionistas'"
        >
          <a vt-icon-button tone="surface" icon="search" label="Buscar piezas" routerLink="/"></a>
          <a routerLink="/perfil" aria-label="Ir a tu perfil"
            ><vt-avatar [nombre]="catalogo.yo.username" anillo="brand" [tam]="40"
          /></a>
        </vt-top-bar>
        <section class="vt-section" aria-label="Coleccionistas que sigues">
          <div class="vt-rail">
            <a class="persona" routerLink="/coleccion/nueva">
              <span class="nueva"><vt-icon name="add" [size]="30" /></span>
              <span class="caption">Tu pieza</span>
            </a>
            @for (u of catalogo.seguidos(); track u.id) {
              <a class="persona" [routerLink]="['/perfil', u.username]">
                <vt-avatar [nombre]="u.username" anillo="brand" [tam]="52" />
                <span class="caption">{{ u.username }}</span>
              </a>
            }
          </div>
        </section>
        @for (p of catalogo.feed(); track p.id) {
          <vt-feed-post [pieza]="p" />
        } @empty {
          <vt-empty-state
            titulo="Tu Feed está esperando"
            texto="Sigue a otros coleccionistas para ver sus piezas aquí."
          >
            <a vt-button routerLink="/">Descubrir coleccionistas</a>
          </vt-empty-state>
        }
      </main>
      <aside class="lateral" aria-label="Tu comunidad">
        <vt-comunidad-lateral modo="sugerencias" />
      </aside>
    </div>
  `,
  styles: `
    .feed {
      display: flex;
      flex-direction: column;
      gap: 24px;
      width: 100%;
      max-width: 640px;
      margin-inline: auto;
      min-width: 0;
    }
    .lateral {
      display: none;
    }
    /* Desde 1000 px: publicaciones a la izquierda y «Tu vitrina» con sugerencias fijas a la derecha. */
    @media (min-width: 1000px) {
      .pagina {
        display: grid;
        grid-template-columns: minmax(0, 640px) 340px;
        justify-content: center;
        align-items: start;
        gap: 32px;
        padding-top: 24px;
      }
      .feed {
        margin-inline: 0;
      }
      .lateral {
        display: block;
        position: sticky;
        top: 24px;
      }
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
  `,
})
export class FeedPage {
  protected readonly catalogo = inject(CatalogoService);
}
