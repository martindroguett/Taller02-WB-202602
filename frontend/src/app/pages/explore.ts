import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { EmptyState } from '../components/empty-state';
import { FollowButton } from '../components/follow-button';
import { compacto } from '../models/format';
import { PieceCard } from '../components/piece-card';
import { PromoBanner } from '../components/promo-banner';
import { SearchField } from '../components/search-field';
import { TopBar } from '../components/top-bar';
import { CATEGORIAS, Filtro } from '../models/vitrina';
import { CatalogoService } from '../services/catalogo.service';

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
          <vt-top-bar titulo="Explorar" [subtitulo]="'Hola, ' + catalogo.yo.username.split('_')[0]">
            <a class="mi-avatar" routerLink="/perfil" aria-label="Ir a tu perfil">
              <vt-avatar [nombre]="catalogo.yo.username" anillo="brand" [tam]="40" />
            </a>
          </vt-top-bar>
          <vt-search-field
            [valor]="busqueda()"
            (valorChange)="cambiarFiltros($event, filtro())"
            placeholder="Busca cartas, vinilos, juguetes…"
          />
        </div>
        <vt-promo-banner class="portada" (accion)="cambiarFiltros('', 'vinilos')" />
        <div class="vt-rail categorias" role="group" aria-label="Categorías">
          @for (f of filtros; track f) {
            <button
              type="button"
              vt-category-chip
              [slug]="f"
              [cuenta]="cuentaCategoria(f)"
              [active]="filtro() === f"
              (click)="cambiarFiltros(busqueda(), f)"
            ></button>
          }
        </div>
        <section class="vt-section" id="recientes" aria-labelledby="recientes-titulo">
          <div class="seccion-titulo">
            <h2 class="title" id="recientes-titulo">
              {{ hayFiltro() ? 'Resultados' : 'Recién llegadas' }}
            </h2>
            <span class="caption vt-muted" role="status">{{ resultados().length }} piezas</span>
          </div>
          @if (resultados().length) {
            <div class="vt-grid">
              @for (p of resultados(); track p.id; let i = $index; let ultima = $last) {
                <vt-piece-card [pieza]="p" />
                @if (!hayFiltro() && (i === 3 || (ultima && i < 3))) {
                  <section class="vt-section seleccion" aria-labelledby="seleccion-titulo">
                    <h3 class="title" id="seleccion-titulo">Para tu vitrina</h3>
                    <div class="vt-rail destacadas">
                      @for (destacada of seleccion(); track destacada.id) {
                        <vt-piece-card [pieza]="destacada" />
                      }
                    </div>
                  </section>
                }
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
      <aside class="lateral" aria-label="Tu comunidad">
        <a class="resumen panel" routerLink="/perfil" aria-label="Ver tu perfil y colección">
          <vt-avatar [nombre]="catalogo.yo.username" anillo="brand" [tam]="64" />
          <div>
            <h2 class="title">Tu vitrina</h2>
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
  protected readonly seleccion = computed(() =>
    [...this.catalogo.piezas()]
      .sort((a, b) => Number(!!b.destacada) - Number(!!a.destacada) || b.megusta - a.megusta)
      .slice(0, 3),
  );

  protected cuentaCategoria(filtro: Filtro): number {
    return this.catalogo.piezas().filter((p) => filtro === 'todas' || p.categoria === filtro)
      .length;
  }

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
