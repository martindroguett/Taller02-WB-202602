import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ActivityRow } from '../components/activity-row';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { EmptyState } from '../components/empty-state';
import { PieceCard } from '../components/piece-card';
import { PieceFloat } from '../components/piece-float';
import { PromoBanner } from '../components/promo-banner';
import { SearchField } from '../components/search-field';
import { TopBar } from '../components/top-bar';
import { CATEGORIAS, Filtro } from '../models/vitrina';
import { CatalogoService } from '../services/catalogo.service';

@Component({
  selector: 'vt-explore-page',
  imports: [
    ActivityRow,
    Avatar,
    Button,
    CategoryChip,
    EmptyState,
    PieceCard,
    PieceFloat,
    PromoBanner,
    RouterLink,
    SearchField,
    TopBar,
  ],
  template: `
    <div class="vt-screen pantalla">
      <main class="principal">
        <vt-top-bar titulo="Explorar">
          <a routerLink="/perfil" aria-label="Ir a tu perfil"
            ><vt-avatar [nombre]="catalogo.yo.nombre" anillo="brand" [tam]="44"
          /></a>
        </vt-top-bar>
        <vt-search-field
          [valor]="busqueda()"
          (valorChange)="cambiarFiltros($event, filtro())"
          placeholder="Busca cartas, juegos, juguetes o vinilos"
        />
        <div class="vt-rail" role="group" aria-label="Categorías">
          @for (f of filtros; track f) {
            <button
              type="button"
              vt-category-chip
              [slug]="f"
              [active]="filtro() === f"
              (click)="cambiarFiltros(busqueda(), f)"
            ></button>
          }
        </div>
        @if (!hayFiltro()) {
          <vt-promo-banner (accion)="cambiarFiltros('', 'vinilos')" />
        }
        <section class="vt-section">
          <h2 class="title">
            {{ hayFiltro() ? 'Resultados' : 'Piezas de la comunidad' }} · {{ resultados().length }}
          </h2>
          @if (resultados().length) {
            <div class="vt-grid">
              @for (p of resultados(); track p.id) {
                <vt-piece-card [pieza]="p" />
              }
            </div>
          } @else {
            <vt-empty-state
              titulo="No encontramos piezas"
              texto="Prueba con otra palabra o cambia de categoría."
            >
              <button
                type="button"
                vt-button
                variant="secondary"
                (click)="cambiarFiltros('', 'todas')"
              >
                Borrar filtros
              </button>
            </vt-empty-state>
          }
        </section>
      </main>
      <aside class="lateral" aria-label="Panel lateral">
        <section class="vt-section">
          <h2 class="title">Actividad reciente</h2>
          @for (p of catalogo.recientes().slice(0, 3); track p.id) {
            <vt-activity-row [pieza]="p" />
          }
        </section>
        <section class="vt-section">
          <h2 class="title">Recién llegada</h2>
          @if (catalogo.recientes()[0]; as p) {
            <vt-piece-float [pieza]="p" />
          }
        </section>
      </aside>
    </div>
  `,
  styles: `
    .principal {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      min-width: 0;
    }
    .lateral {
      display: none;
    }
    @media (min-width: 1280px) {
      .pantalla {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 280px;
        gap: var(--space-6);
        align-items: start;
      }
      .lateral {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        position: sticky;
        top: var(--space-4);
      }
    }
  `,
})
export class ExplorePage {
  protected readonly catalogo = inject(CatalogoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  // La URL conserva la búsqueda y la categoría al volver desde una pieza.
  protected readonly busqueda = computed(() => this.params().get('q') ?? '');
  protected readonly filtros: Filtro[] = ['todas', ...CATEGORIAS.map((c) => c.slug)];
  protected readonly filtro = computed<Filtro>(
    () => this.filtros.find((f) => f === this.params().get('categoria')) ?? 'todas',
  );
  protected readonly hayFiltro = computed(
    () => this.busqueda().trim() !== '' || this.filtro() !== 'todas',
  );
  protected readonly resultados = computed(() => {
    const q = this.busqueda().trim().toLocaleLowerCase('es');
    return this.catalogo
      .recientes()
      .filter(
        (p) =>
          (this.filtro() === 'todas' || p.categoria === this.filtro()) &&
          (!q || `${p.nombre} ${p.descripcion}`.toLocaleLowerCase('es').includes(q)),
      );
  });

  protected cambiarFiltros(q: string, categoria: Filtro): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: q || null, categoria: categoria === 'todas' ? null : categoria },
      replaceUrl: true,
    });
  }
}
