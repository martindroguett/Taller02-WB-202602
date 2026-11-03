import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { EmptyState } from '../components/empty-state';
import { PromoBanner } from '../components/promo-banner';
import { PieceCard } from '../components/piece-card';
import { SearchField } from '../components/search-field';
import { TopBar } from '../components/top-bar';
import { CATEGORIAS, Filtro } from '../models/vitrina';
import { CatalogoPublicoService, PiezaPublica } from '../services/catalogo-publico.service';

@Component({
  selector: 'vt-explore-page',
  imports: [Button, CategoryChip, EmptyState, PieceCard, PromoBanner, SearchField, TopBar],
  template: `
    <main class="vt-screen pantalla">
      <div class="cabecera">
        <vt-top-bar titulo="Explorar" subtitulo="Descubre colecciones" />
        <vt-search-field
          [valor]="busqueda()"
          (valorChange)="buscar($event)"
          placeholder="Busca cartas, vinilos, juguetes…"
        />
      </div>
      <vt-promo-banner class="portada" (accion)="elegirCategoria('vinilos')" />
      <div class="vt-rail categorias" role="group" aria-label="Categorías">
        @for (f of filtros; track f) {
          <button
            type="button"
            vt-category-chip
            [slug]="f"
            [active]="filtro() === f"
            (click)="elegirCategoria(f)"
          ></button>
        }
      </div>
      <section class="vt-section" aria-labelledby="resultados-titulo">
        <div class="seccion-titulo">
          <h2 class="title" id="resultados-titulo">
            {{ busqueda().trim() || filtro() !== 'todas' ? 'Resultados' : 'Recién llegadas' }}
          </h2>
          @if (!cargando() || resultados().length) {
            <span class="caption vt-muted" role="status">{{ total() }} piezas</span>
          }
        </div>
        @if (resultados().length) {
          <div class="vt-grid">
            @for (p of resultados(); track p.id) {
              <vt-piece-card [pieza]="p" />
            }
          </div>
        }
        @if (cargando()) {
          <p role="status">Cargando piezas…</p>
        }
        @if (error()) {
          <div role="alert">
            <p>No pudimos cargar las piezas. Inténtalo de nuevo.</p>
            <button type="button" vt-button variant="secondary" (click)="cargar()">
              Reintentar
            </button>
          </div>
        } @else if (!cargando() && !resultados().length) {
          <vt-empty-state
            [titulo]="
              busqueda().trim() || filtro() !== 'todas'
                ? 'No encontramos piezas'
                : 'Aún no hay piezas'
            "
            [texto]="
              busqueda().trim() || filtro() !== 'todas'
                ? 'Prueba con otra palabra o cambia de categoría.'
                : 'El catálogo todavía está vacío.'
            "
          >
            <button type="button" vt-button variant="secondary" (click)="limpiar()">
              Borrar filtros
            </button>
          </vt-empty-state>
        }
        @if (!error() && !cargando() && desplazamiento < total()) {
          <button type="button" vt-button variant="secondary" (click)="cargar()">Cargar más</button>
        }
      </section>
    </main>
  `,
  styles: `
    .pantalla,
    .cabecera {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 0;
    }
    .pantalla {
      padding-top: 24px;
    }
    .portada {
      display: none;
    }
    .categorias {
      margin-block: -4px;
    }
    .seccion-titulo {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }
    .seccion-titulo .title {
      font-size: clamp(17px, 4.6vw, 21px);
      line-height: 1.4;
    }
    @media (min-width: 1000px) {
      .portada {
        display: block;
      }
      .cabecera {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
      }
    }
  `,
})
export class ExplorePage {
  private readonly api = inject(CatalogoPublicoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private solicitud?: Subscription;
  private espera?: ReturnType<typeof setTimeout>;
  protected readonly filtros: Filtro[] = ['todas', ...CATEGORIAS.map((c) => c.slug)];
  protected readonly busqueda = signal('');
  protected readonly filtro = signal<Filtro>('todas');
  protected readonly resultados = signal<PiezaPublica[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(false);
  protected readonly error = signal(false);
  protected desplazamiento = 0;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      clearTimeout(this.espera);
      this.busqueda.set(params.get('q') ?? '');
      this.filtro.set(this.filtros.find((f) => f === params.get('categoria')) ?? 'todas');
      this.reiniciar();
    });
    this.destroy.onDestroy(() => {
      clearTimeout(this.espera);
      this.solicitud?.unsubscribe();
    });
  }

  protected buscar(q: string): void {
    this.busqueda.set(q);
    clearTimeout(this.espera);
    this.solicitud?.unsubscribe();
    this.resultados.set([]);
    this.total.set(0);
    this.desplazamiento = 0;
    this.error.set(false);
    this.cargando.set(true);
    this.espera = setTimeout(() => this.actualizarUrl(), 300);
  }

  protected elegirCategoria(f: Filtro): void {
    clearTimeout(this.espera);
    this.filtro.set(f);
    this.actualizarUrl();
  }

  protected limpiar(): void {
    clearTimeout(this.espera);
    this.busqueda.set('');
    this.filtro.set('todas');
    this.actualizarUrl();
  }

  private actualizarUrl(): void {
    const q = this.busqueda();
    const categoria = this.filtro();
    // Al elegir el filtro ya activo también se debe cancelar una búsqueda pendiente.
    if (
      (this.route.snapshot.queryParamMap.get('q') ?? '') === q &&
      (this.route.snapshot.queryParamMap.get('categoria') ?? 'todas') === categoria
    ) {
      this.reiniciar();
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: q || null,
        categoria: categoria === 'todas' ? null : categoria,
      },
      replaceUrl: true,
    });
  }

  private reiniciar(): void {
    this.solicitud?.unsubscribe();
    this.resultados.set([]);
    this.total.set(0);
    this.desplazamiento = 0;
    this.cargando.set(false);
    this.cargar();
  }

  protected cargar(): void {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.error.set(false);
    this.solicitud = this.api
      .listar(this.busqueda(), this.filtro(), this.desplazamiento)
      .subscribe({
        next: (pagina) => {
          this.resultados.update((actuales) => {
            const ids = new Set(actuales.map((p) => p.id));
            const nuevas = pagina.items.filter((p) => {
              if (ids.has(p.id)) return false;
              ids.add(p.id);
              return true;
            });
            return [...actuales, ...nuevas];
          });
          this.total.set(pagina.total);
          this.desplazamiento = pagina.desplazamiento + pagina.items.length;
          // Evita repetir una página vacía si el catálogo cambia durante la navegación.
          if (!pagina.items.length) this.desplazamiento = pagina.total;
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set(true);
        },
      });
  }
}
