import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { FeedPost } from '../components/feed-post';
import { TopBar } from '../components/top-bar';
import { CatalogoService } from '../services/catalogo.service';

@Component({
  selector: 'vt-feed-page',
  imports: [Avatar, Button, EmptyState, FeedPost, RouterLink, TopBar],
  template: `
    <main class="vt-screen feed">
      <vt-top-bar titulo="Feed" />
      @if (catalogo.seguidos().length) {
        <section class="vt-section" aria-label="Coleccionistas que sigues">
          <h2 class="title">Coleccionistas que sigues</h2>
          <div class="vt-rail">
            @for (u of catalogo.seguidos(); track u.id) {
              <a class="persona" [routerLink]="['/perfil', u.username]">
                <vt-avatar [nombre]="u.username" [tam]="52" />
                <span class="caption">{{ u.username }}</span>
              </a>
            }
          </div>
        </section>
      }
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
  `,
  styles: `
    .feed {
      max-width: 640px;
    }
    .persona {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      min-width: 72px;
      padding: var(--space-2) var(--space-1);
    }
  `,
})
export class FeedPage {
  protected readonly catalogo = inject(CatalogoService);
}
