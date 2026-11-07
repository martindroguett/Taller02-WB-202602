import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { Icon } from '../components/icon';
import { EmptyState } from '../components/empty-state';
import { PieceCard } from '../components/piece-card';
import { TopBar } from '../components/top-bar';
import { CATEGORIAS, Filtro } from '../models/vitrina';
import { CatalogoService } from '../services/catalogo.service';

@Component({
  selector: 'vt-favorites-page',
  imports: [Button, CategoryChip, EmptyState, Icon, PieceCard, RouterLink, TopBar],
  template: `
    <main class="vt-screen">
      <vt-top-bar titulo="Favoritos" />
      @if (catalogo.favoritas().length) {
        <div class="tiles" role="group" aria-label="Colecciones por categoría">
          @for (c of carpetas(); track c.slug) {
            <button
              type="button"
              class="tile vt-c-{{ c.slug }}"
              [class.on]="filtro() === c.slug"
              [attr.aria-pressed]="filtro() === c.slug"
              (click)="filtro.set(filtro() === c.slug ? 'todas' : c.slug)"
            >
              <span class="disco"
                ><vt-icon [name]="c.icono" [size]="28" [filled]="filtro() === c.slug"
              /></span>
              <span class="datos">
                <span class="title">{{ c.nombre }}</span>
                <span class="cuenta"
                  >{{ c.cuenta }} {{ c.cuenta === 1 ? 'GUARDADA' : 'GUARDADAS' }}</span
                >
              </span>
              @for (m of c.minis; track m; let i = $index) {
                <span
                  class="mini"
                  [style.--giro.deg]="i === 0 ? -8 : 6"
                  [style.right.px]="28 + i * 56"
                  ><img [src]="m" alt=""
                /></span>
              }
            </button>
          }
        </div>
        <div class="vt-rail chips" role="group" aria-label="Categorías">
          @for (f of filtros; track f) {
            <button
              type="button"
              vt-category-chip
              [slug]="f"
              [active]="filtro() === f"
              (click)="filtro.set(f)"
            ></button>
          }
        </div>
        <section class="vt-section">
          <h2 class="title">Guardadas · {{ visibles().length }}</h2>
          <div class="vt-grid">
            @for (p of visibles(); track p.id) {
              <vt-piece-card [pieza]="p" />
            }
          </div>
          @if (!visibles().length) {
            <vt-empty-state
              titulo="Nada guardado en esta categoría"
              texto="Prueba con otra categoría."
            >
              <button type="button" vt-button variant="secondary" (click)="filtro.set('todas')">
                Ver todas
              </button>
            </vt-empty-state>
          }
        </section>
      } @else {
        <vt-empty-state
          titulo="Aún no guardas piezas"
          texto="Toca el marcador de una pieza y la verás aquí."
          categoria="vinilos"
        >
          <a vt-button routerLink="/">Explorar piezas</a>
        </vt-empty-state>
      }
    </main>
  `,
  styles: `
    /* Desde 1000 px los filtros son cuatro colecciones con sus piezas asomando; en el teléfono siguen los chips. */
    .tiles {
      display: none;
    }
    @media (min-width: 1000px) {
      .vt-screen {
        padding-top: var(--space-6);
      }
      .chips {
        display: none;
      }
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--space-4);
        margin-top: var(--space-5);
      }
      .tile {
        position: relative;
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 112px;
        padding: var(--space-4) var(--space-5);
        border: 0;
        border-radius: 28px;
        background: var(--c-soft);
        color: var(--ink);
        text-align: left;
        cursor: pointer;
        transition: transform 120ms ease;
      }
      .tile:active {
        transform: scale(0.98);
      }
      .tile.on {
        box-shadow: 0 0 0 3px var(--c-ink);
      }
      .disco {
        display: grid;
        place-items: center;
        flex: none;
        width: 44px;
        height: 44px;
        border-radius: var(--radius-pill);
        background: var(--surface);
        color: var(--c-ink);
      }
      .datos {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }
      .datos .title {
        font-size: 16px;
      }
      .cuenta {
        font: var(--text-catalog);
        letter-spacing: 0.06em;
        color: var(--c-ink);
      }
      .mini {
        position: absolute;
        top: -18px;
        width: 56px;
        height: 72px;
        overflow: hidden;
        border: 3px solid var(--on-night);
        border-radius: 14px;
        background: var(--c-soft);
        box-shadow: var(--shadow-pop);
        transform: rotate(var(--giro));
      }
      .mini img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .vt-grid {
        grid-template-columns: repeat(auto-fill, minmax(236px, 1fr));
        gap: var(--space-4);
      }
    }
  `,
})
export class FavoritesPage {
  protected readonly catalogo = inject(CatalogoService);
  protected readonly filtros: Filtro[] = ['todas', ...CATEGORIAS.map((c) => c.slug)];
  protected readonly filtro = signal<Filtro>('todas');
  protected readonly carpetas = computed(() =>
    CATEGORIAS.map((c) => {
      const piezas = this.catalogo.favoritas().filter((p) => p.categoria === c.slug);
      return {
        ...c,
        cuenta: piezas.length,
        minis: piezas
          .filter((p) => p.imagen_url)
          .slice(0, 2)
          .map((p) => p.imagen_url),
      };
    }),
  );
  protected readonly visibles = computed(() =>
    this.catalogo
      .favoritas()
      .filter((p) => this.filtro() === 'todas' || p.categoria === this.filtro()),
  );
}
