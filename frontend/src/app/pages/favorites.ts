import { Component, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { EmptyState } from '../components/empty-state';
import { PieceCard } from '../components/piece-card';
import { TopBar } from '../components/top-bar';
import { CATEGORIAS, Filtro } from '../models/vitrina';
import { InteraccionesService } from '../services/interacciones.service';

const POR_PAGINA = 20;

@Component({
  selector: 'vt-favorites-page',
  imports: [
    Button,
    CategoryChip,
    EmptyState,
    MatProgressSpinnerModule,
    PieceCard,
    RouterLink,
    TopBar,
  ],
  template: `
    <main class="vt-screen">
      <vt-top-bar titulo="Favoritos" />
      @if (favoritos.isLoading()) {
        <div class="cargando" role="status"><mat-spinner diameter="28" /> Cargando favoritos…</div>
      } @else if (favoritos.error()) {
        <vt-empty-state
          titulo="No pudimos cargar tus favoritos"
          texto="Comprueba tu conexión e inténtalo de nuevo."
        >
          <button vt-button type="button" (click)="favoritos.reload()">Reintentar</button>
        </vt-empty-state>
      } @else if (guardadas().length || desplazamiento() > 0) {
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
          @if (total() > porPagina || desplazamiento() > 0) {
            <nav class="paginacion" aria-label="Páginas de favoritos">
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
                [disabled]="desplazamiento() + porPagina >= total()"
                (click)="irA(desplazamiento() + porPagina)"
              >
                Siguiente
              </button>
            </nav>
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
export class FavoritesPage {
  private readonly interacciones = inject(InteraccionesService);

  protected readonly porPagina = POR_PAGINA;
  protected readonly filtros: Filtro[] = ['todas', ...CATEGORIAS.map((c) => c.slug)];
  protected readonly filtro = signal<Filtro>('todas');
  protected readonly desplazamiento = signal(0);
  protected readonly favoritos = this.interacciones.favoritos(this.desplazamiento);

  protected readonly total = computed(() => this.favoritos.value()?.total ?? 0);
  // Al quitar una pieza de favoritos desaparece al instante; con «Deshacer» vuelve a aparecer.
  protected readonly guardadas = computed(() =>
    (this.favoritos.value()?.items ?? []).filter((p) => this.interacciones.estado(p).guardada),
  );
  protected readonly visibles = computed(() =>
    this.guardadas().filter((p) => this.filtro() === 'todas' || p.categoria === this.filtro()),
  );

  protected irA(desplazamiento: number): void {
    this.desplazamiento.set(desplazamiento);
    window.scrollTo({ top: 0 });
  }
}
