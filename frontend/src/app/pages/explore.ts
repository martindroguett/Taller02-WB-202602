import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Avatar } from '../components/avatar';
import { FollowButton } from '../components/follow-button';
import { RouterLink } from '@angular/router';
import { compacto } from '../models/format';
import { CatalogoService } from '../services/catalogo.service';
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
  imports: [
    Avatar,
    Button,
    CategoryChip,
    EmptyState,
    FollowButton,
    PieceCard,
    PromoBanner,
    RouterLink,
    SearchField,
    TopBar,
  ],
  template: `
    <div class="vt-screen pantalla">
      <main class="principal">
        <div class="cabecera">
          <vt-top-bar titulo="Explorar" subtitulo="Descubre colecciones">
            <a class="mi-avatar" routerLink="/perfil" aria-label="Ir al perfil de demostración"
              ><vt-avatar [nombre]="catalogo.yo.username" anillo="brand" [tam]="40"
            /></a>
          </vt-top-bar>
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
              @for (p of resultados(); track p.id; let i = $index; let ultima = $last) {
                <vt-piece-card [pieza]="p" />
                @if (!busqueda().trim() && filtro() === 'todas' && (i === 3 || (ultima && i < 3))) {
                  <section class="vt-section seleccion" aria-labelledby="seleccion-titulo">
                    <h3 class="title" id="seleccion-titulo">Para tu vitrina</h3>
                    <div class="vt-rail destacadas">
                      @for (destacada of resultados().slice(0, 3); track destacada.id) {
                        <vt-piece-card [pieza]="destacada" />
                      }
                    </div>
                  </section>
                }
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
            <button type="button" vt-button variant="secondary" (click)="cargar()">
              Cargar más
            </button>
          }
        </section>
      </main>
      <aside class="lateral" aria-label="Tu comunidad">
        <a class="resumen panel" routerLink="/perfil" aria-label="Ver tu perfil y colección">
          <vt-avatar [nombre]="catalogo.yo.username" anillo="brand" [tam]="64" />
          <div>
            <h2 class="title">Tu vitrina</h2>
            <span class="caption vt-muted">Demostración</span>
            <p class="caption vt-muted">&#64;{{ catalogo.yo.username }}</p>
          </div>
          <dl class="cifras">
            <div>
              <dd class="stat">{{ catalogo.piezasDe(catalogo.yo.id).length }}</dd>
              <dt>Piezas</dt>
            </div>
            <div>
              <dd class="stat">{{ compacto(catalogo.seguidores(catalogo.yo)) }}</dd>
              <dt>Seguidores</dt>
            </div>
            <div>
              <dd class="stat">{{ catalogo.seguidos().length }}</dd>
              <dt>Siguiendo</dt>
            </div>
          </dl>
        </a>
        <section class="panel comunidad">
          <h2 class="title">Coleccionistas</h2>
          <span class="caption vt-muted">Demostración</span>
          <p class="caption vt-muted">Encuentra tu próxima conexión.</p>
          @for (u of comunidad; track u.id) {
            <div class="recomendacion">
              <a class="persona" [routerLink]="['/perfil', u.username]">
                <vt-avatar [nombre]="u.username" [tam]="40" />
                <span class="persona-info"
                  ><strong>&#64;{{ u.username }}</strong
                  ><span class="caption vt-muted"
                    >{{ catalogo.piezasDe(u.id).length }}
                    {{ catalogo.piezasDe(u.id).length === 1 ? 'pieza' : 'piezas' }}</span
                  ></span
                >
              </a>
              <vt-follow-button [usuarioId]="u.id" size="sm" />
            </div>
          }
        </section>
      </aside>
    </div>
  `,
  styles: `
    .principal,
    .cabecera {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 0;
    }
    .pantalla {
      padding-top: 24px;
    }
    .lateral,
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
    .seleccion {
      grid-column: 1 / -1;
      min-width: 0;
      padding-block: 12px;
    }
    .destacadas {
      gap: 16px;
      padding-block: 6px 12px;
      scroll-snap-type: x mandatory;
      scroll-padding-inline: 16px;
    }
    .destacadas vt-piece-card {
      width: min(62vw, 260px);
      scroll-snap-align: start;
    }
    #recientes {
      scroll-margin-top: 24px;
    }
    .panel {
      background: var(--surface);
      border-radius: 28px;
      padding: 24px;
      box-shadow: var(--shadow-card);
    }
    .resumen {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
    }
    .resumen vt-avatar {
      margin-top: 4px;
    }
    .cifras {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      width: 100%;
      margin: 0;
      padding: 16px 4px;
      background: var(--surface-sunken);
      border-radius: 20px;
    }
    .cifras div + div {
      border-left: 1px solid var(--line);
    }
    dd {
      margin: 0;
      font-size: 18px;
    }
    dt {
      font: var(--text-caption);
      color: var(--ink-muted);
      margin-top: 4px;
    }
    .comunidad {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .comunidad > p {
      margin-top: -8px;
    }
    .recomendacion {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
    }
    .persona {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      flex: 1;
    }
    .persona-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .persona-info strong {
      font: var(--text-label);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @media (min-width: 1000px) {
      .cabecera {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
      }
      .portada {
        display: block;
      }
      .seleccion {
        display: none;
      }
    }
    @media (min-width: 1280px) {
      .pantalla {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 28px;
        align-items: start;
      }
      .lateral {
        display: flex;
        flex-direction: column;
        gap: 20px;
        position: sticky;
        top: 24px;
      }
      .mi-avatar {
        display: none;
      }
      .vt-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (min-width: 1400px) {
      .vt-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
  `,
})
export class ExplorePage {
  protected readonly catalogo = inject(CatalogoService);
  protected readonly compacto = compacto;
  protected readonly comunidad = this.catalogo.usuarios.filter((u) => u.id !== this.catalogo.yo.id);
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
