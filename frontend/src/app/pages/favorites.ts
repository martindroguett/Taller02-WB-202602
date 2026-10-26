import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { EmptyState } from '../components/empty-state';
import { PieceCard } from '../components/piece-card';
import { TopBar } from '../components/top-bar';
import { CATEGORIAS, Filtro } from '../models/vitrina';
import { CatalogoService } from '../services/catalogo.service';

@Component({
  selector: 'vt-favorites-page',
  imports: [Button, CategoryChip, EmptyState, PieceCard, RouterLink, TopBar],
  template: `
    <main class="vt-screen">
      <vt-top-bar titulo="Favoritos" />
      @if (catalogo.favoritas().length) {
        <div class="vt-rail" role="group" aria-label="Categorías">
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
})
export class FavoritesPage {
  protected readonly catalogo = inject(CatalogoService);
  protected readonly filtros: Filtro[] = ['todas', ...CATEGORIAS.map((c) => c.slug)];
  protected readonly filtro = signal<Filtro>('todas');
  protected readonly visibles = computed(() =>
    this.catalogo
      .favoritas()
      .filter((p) => this.filtro() === 'todas' || p.categoria === this.filtro()),
  );
}
