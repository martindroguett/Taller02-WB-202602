import { MatChipsModule } from '@angular/material/chips';
import { Component, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { Icon } from '../components/icon';
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
    MatChipsModule,
    EmptyState,
    Icon,
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
      } @else if (total() || filtro() !== 'todas' || desplazamiento() > 0) {
        <div class="tiles" role="group" aria-label="Colecciones por categoría">
          @for (c of carpetas(); track c.slug) {
            <button
              type="button"
              class="tile vt-c-{{ c.slug }}"
              [class.on]="filtro() === c.slug"
              [attr.aria-pressed]="filtro() === c.slug"
              (click)="filtrar(filtro() === c.slug ? 'todas' : c.slug)"
            >
              <span class="disco"
                ><vt-icon [name]="c.icono" [size]="28" [filled]="filtro() === c.slug"
              /></span>
              <span class="datos">
                <span class="title">{{ c.nombre }}</span>
                <span class="cuenta"
                  >{{ c.cuenta ?? '—' }} {{ c.cuenta === 1 ? 'GUARDADA' : 'GUARDADAS' }}</span
                >
              </span>
              @for (m of c.minis; track $index; let i = $index) {
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
        <mat-chip-listbox
          class="vt-rail vt-category-list chips"
          aria-label="Categorías"
          [value]="filtro()"
          (change)="filtrar($event.value)"
        >
          @for (f of filtros; track f) {
            <mat-basic-chip-option
              [value]="f"
              (selectionChange)="$event.isUserInput && !$event.selected && $event.source.select()"
            >
              <vt-category-chip [slug]="f" [active]="filtro() === f" />
            </mat-basic-chip-option>
          }
        </mat-chip-listbox>
        <section class="vt-section">
          <h2 class="title">Guardadas · {{ total() }}</h2>
          <div class="vt-grid">
            @for (p of visibles(); track p.id) {
              <vt-piece-card [pieza]="p" [ids]="idsVisibles()" />
            }
          </div>
          @if (!visibles().length) {
            <vt-empty-state
              titulo="Nada guardado en esta categoría"
              texto="Prueba con otra categoría."
            >
              <button type="button" vt-button variant="secondary" (click)="filtrar('todas')">
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
  protected readonly favoritos = this.interacciones.favoritos(this.desplazamiento, this.filtro);
  private readonly categorias = CATEGORIAS.map((c) => ({
    ...c,
    pagina: this.interacciones.favoritos(
      () => 0,
      () => c.slug,
      2,
    ),
  }));
  protected readonly carpetas = computed(() =>
    this.categorias.map((c) => ({
      ...c,
      cuenta: c.pagina.hasValue() ? c.pagina.value().total : null,
      minis: c.pagina.hasValue()
        ? c.pagina
            .value()
            .items.map((p) => p.imagen_url)
            .filter(Boolean)
        : [],
    })),
  );

  protected readonly total = computed(() => this.favoritos.value()?.total ?? 0);
  // Al quitar una pieza de favoritos desaparece al instante; con «Deshacer» vuelve a aparecer.
  protected readonly guardadas = computed(() =>
    (this.favoritos.value()?.items ?? []).filter((p) => this.interacciones.estado(p).guardada),
  );
  protected readonly visibles = this.guardadas;
  protected readonly idsVisibles = computed(() => this.visibles().map((p) => p.id));

  protected filtrar(filtro: Filtro): void {
    this.desplazamiento.set(0);
    this.filtro.set(filtro);
  }

  protected irA(desplazamiento: number): void {
    this.desplazamiento.set(desplazamiento);
    window.scrollTo({ top: 0 });
  }
}
