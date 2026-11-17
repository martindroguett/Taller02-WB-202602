import { MatChipsModule } from '@angular/material/chips';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AccionesMovil, RADIOS_KM } from '../components/acciones-movil';
import { Avatar } from '../components/avatar';
import { ComunidadLateral } from '../components/comunidad-lateral';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Button } from '../components/button';
import { CategoryChip } from '../components/category-chip';
import { EmptyState } from '../components/empty-state';
import { Icon } from '../components/icon';
import { IconButton } from '../components/icon-button';
import { PromoBanner } from '../components/promo-banner';
import { PieceCard } from '../components/piece-card';
import { SearchField } from '../components/search-field';
import { SorpresaSheet } from '../components/sorpresa-sheet';
import { TopBar } from '../components/top-bar';
import { CATEGORIAS, Filtro } from '../models/vitrina';
import { CatalogoPublicoService, PiezaPublica } from '../services/catalogo-publico.service';
import { DetalleDialogo } from '../services/detalle-dialogo';
import { ToastService } from '../services/toast.service';
import {
  DispositivoService,
  interpretarCodigo,
  mensajeDispositivo,
} from '../services/dispositivo.service';

@Component({
  selector: 'vt-explore-page',
  host: { '(window:resize)': 'medirRiel()', '(document:keydown)': 'atajo($event)' },
  imports: [
    AccionesMovil,
    Avatar,
    Button,
    CategoryChip,
    MatChipsModule,
    EmptyState,
    ComunidadLateral,
    Icon,
    IconButton,
    PieceCard,
    PromoBanner,
    RouterLink,
    SearchField,
    SorpresaSheet,
    TopBar,
  ],
  template: `
    <div class="vt-screen pantalla">
      <main class="principal">
        <div class="cabecera">
          <vt-top-bar titulo="Explorar" subtitulo="Descubre colecciones">
            <a
              class="mi-avatar"
              [routerLink]="
                auth.usuario() ? ['/perfil'] : ['/ingresar']
              "
              [attr.aria-label]="auth.usuario() ? 'Ir a tu perfil' : 'Ingresar'"
              ><vt-avatar [nombre]="auth.usuario()?.username ?? ''" anillo="brand" [tam]="40"
            /></a>
          </vt-top-bar>
          <vt-search-field
            [valor]="busqueda()"
            (valorChange)="buscar($event)"
            placeholder="Busca cartas, vinilos, juguetes…"
          />
        </div>
        <vt-acciones-movil
          [escaner]="dispositivo.nativa"
          [escaneando]="escaneando()"
          [ubicando]="ubicando()"
          [cercaActiva]="!!cerca()"
          (escanear)="escanear()"
          (cerca)="alternarCerca()"
        />
        @if (codigo()) {
          <p class="filtro-activo caption">
            Piezas con el código <strong>{{ codigo() }}</strong>
            <button
              type="button"
              vt-button
              size="sm"
              variant="secondary"
              icon="close"
              (click)="quitarCodigo()"
            >
              Quitar
            </button>
          </p>
        }
        @if (!cerca() && !codigo()) {
          <vt-promo-banner class="portada" (accion)="elegirCategoria('vinilos')" />
        }
        <div class="filtros">
          <mat-chip-listbox
            class="vt-rail vt-category-list categorias"
            aria-label="Categorías"
            [value]="filtro()"
            (change)="elegirCategoria($event.value)"
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
          <button
            type="button"
            class="cerca-chip"
            [class.on]="!!cerca()"
            [disabled]="ubicando()"
            [attr.aria-pressed]="!!cerca()"
            (click)="alternarCerca()"
          >
            <span class="disco"><vt-icon name="near_me" [size]="20" [filled]="!!cerca()" /></span>
            <span>{{ ubicando() ? 'Ubicándote…' : 'Cerca de mí' }}</span>
          </button>
        </div>
        @if (
          !busqueda().trim() &&
          filtro() === 'todas' &&
          !codigo() &&
          !cerca() &&
          piezasDestacadas().length
        ) {
          <section class="vt-section" aria-labelledby="destacadas-titulo">
            <h2 class="title" id="destacadas-titulo">Destacadas</h2>
            <div class="carrusel">
              <div #riel class="vt-rail destacadas" (scroll)="medirRiel()">
                @for (p of piezasDestacadas(); track p.id) {
                  <vt-piece-card [pieza]="p" [ids]="idsDestacadas()" />
                }
              </div>
              @if (hayAtras()) {
                <button
                  type="button"
                  vt-icon-button
                  tone="glass"
                  class="flecha atras"
                  icon="chevron_left"
                  label="Ver piezas anteriores"
                  (click)="mover(-1)"
                ></button>
              }
              @if (hayAdelante()) {
                <button
                  type="button"
                  vt-icon-button
                  tone="glass"
                  class="flecha adelante"
                  icon="chevron_right"
                  label="Ver más piezas destacadas"
                  (click)="mover(1)"
                ></button>
              }
            </div>
          </section>
        }
        <section class="vt-section" aria-labelledby="resultados-titulo">
          <div class="seccion-titulo">
            <h2 class="title" id="resultados-titulo">
              {{
                cerca()
                  ? 'Cerca de ti'
                  : busqueda().trim() || filtro() !== 'todas' || codigo()
                    ? 'Resultados'
                    : 'Recién llegadas'
              }}
            </h2>
            @if (!cargando() || resultados().length) {
              <span class="caption vt-muted" role="status">{{
                resultados().length < total()
                  ? 'Mostrando ' + resultados().length + ' de ' + total()
                  : total() + ' piezas'
              }}</span>
            }
          </div>
          @if (cerca()) {
            <div class="radio-fila">
              <span class="caption vt-muted" id="radio-etiqueta">Distancia</span>
              <div class="segmentos" role="radiogroup" aria-labelledby="radio-etiqueta">
                @for (r of radios; track r) {
                  <button
                    type="button"
                    role="radio"
                    class="segmento"
                    [class.elegido]="radioKm() === r"
                    [attr.aria-checked]="radioKm() === r"
                    (click)="cambiarRadio(r)"
                  >
                    {{ r }} km
                  </button>
                }
              </div>
            </div>
          }
          @if (resultados().length) {
            <div class="vt-grid">
              @for (p of resultados(); track p.id) {
                <vt-piece-card [pieza]="p" [distanciaKm]="cerca() ? p.distancia_km : null" />
              }
            </div>
          }
          @if (cargando()) {
            @if (!resultados().length) {
              <div class="vt-grid" aria-hidden="true">
                @for (i of esqueleto; track i) {
                  <div class="vt-esqueleto tarjeta"></div>
                }
              </div>
            }
            <p class="vt-sr-only" role="status">Cargando piezas…</p>
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
                cerca()
                  ? 'No hay piezas a menos de ' + radioKm() + ' km'
                  : codigo()
                    ? 'Nadie tiene esta pieza todavía'
                    : busqueda().trim() || filtro() !== 'todas'
                      ? 'No encontramos piezas'
                      : 'Aún no hay piezas'
              "
              [texto]="
                cerca()
                  ? 'Prueba con un radio mayor o agrega una pieza con tu ubicación para que otros la encuentren.'
                  : codigo()
                    ? 'Agrégala a tu colección con este código y sé el primero.'
                    : busqueda().trim() || filtro() !== 'todas'
                      ? 'Prueba con otra palabra o cambia de categoría.'
                      : 'El catálogo todavía está vacío.'
              "
            >
              @if (cerca() && radioSiguiente(); as siguiente) {
                <button
                  type="button"
                  vt-button
                  variant="accent"
                  icon="zoom_out_map"
                  (click)="cambiarRadio(siguiente)"
                >
                  Ampliar a {{ siguiente }} km
                </button>
              }
              @if (codigo() && auth.usuario()) {
                <a
                  vt-button
                  [routerLink]="['/coleccion/nueva']"
                  [queryParams]="{ codigo: codigo() }"
                  >Agregar pieza</a
                >
              }
              <button
                type="button"
                vt-button
                variant="secondary"
                icon="filter_alt_off"
                (click)="limpiar()"
              >
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
        <vt-comunidad-lateral />
      </aside>
    </div>
    <vt-sorpresa-sheet
      [pieza]="sorpresa()"
      [cargando]="sorprendiendo()"
      [consejo]="sensorActivo() ? 'También puedes sacudir el celular otra vez.' : ''"
      (otra)="sorprender()"
      (ver)="verSorpresa()"
      (cerrada)="sorpresa.set(null)"
    />
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
    .lateral {
      display: none;
    }
    .categorias {
      margin-block: -4px;
    }
    .filtros {
      display: contents;
    }
    /* «Cerca de mí» como una categoría más, solo en pantallas anchas (en el celular va en las acciones). */
    .cerca-chip {
      display: none;
    }
    .filtro-activo {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      overflow-wrap: anywhere;
    }
    .seccion-titulo {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }
    /* Selector de distancia: segmentos dentro de una píldora, en la cabecera de los resultados. */
    .radio-fila {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-top: calc(var(--space-2) * -1);
    }
    .segmentos {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
      padding: 4px;
      border-radius: var(--radius-pill);
      background: var(--surface);
      box-shadow: var(--shadow-card);
    }
    .segmento {
      min-height: 40px;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-pill);
      background: transparent;
      color: var(--ink-muted);
      font: var(--text-label);
      white-space: nowrap;
      cursor: pointer;
      transition:
        background-color 160ms ease,
        color 160ms ease;
    }
    .segmento:hover:not(.elegido) {
      background: var(--brand-soft);
      color: var(--brand);
    }
    .segmento.elegido {
      background: var(--brand);
      color: var(--on-brand);
    }
    @media (min-width: 600px) {
      .radio-fila {
        flex-direction: row;
        align-items: center;
        gap: var(--space-4);
        margin-block: var(--space-2) var(--space-4);
      }
      .segmentos {
        grid-template-columns: repeat(4, 92px);
      }
    }
    .seccion-titulo .title {
      font-size: clamp(17px, 4.6vw, 21px);
      line-height: 1.4;
    }
    .carrusel {
      position: relative;
    }
    .flecha {
      position: absolute;
      top: 50%;
      translate: 0 -50%;
      z-index: 1;
    }
    .atras {
      left: 8px;
    }
    .adelante {
      right: 8px;
    }
    @media (hover: none) {
      .flecha {
        display: none;
      }
    }
    @media (prefers-reduced-motion: no-preference) {
      .destacadas {
        scroll-behavior: smooth;
      }
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
    @media (min-width: 1000px) {
      .cabecera {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
      }
      .portada {
        display: block;
        margin-top: 28px;
      }
      /* Los filtros quedan pegados arriba al bajar por la lista. */
      .filtros {
        display: flex;
        align-items: center;
        gap: 8px;
        position: sticky;
        top: 0;
        z-index: 3;
        margin-block: -4px;
        padding-block: 8px;
        background: var(--bg);
      }
      .categorias {
        flex: 0 1 auto;
        min-width: 0;
        margin-block: 0;
      }
      .cerca-chip {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: var(--space-2);
        min-height: var(--tap-target);
        margin-left: auto;
        padding: 0 var(--space-4) 0 6px;
        border: 1.5px dashed var(--line-strong);
        border-radius: var(--radius-pill);
        background: transparent;
        color: var(--ink);
        font: var(--text-label);
        white-space: nowrap;
        cursor: pointer;
        transition:
          background-color 160ms ease,
          border-color 160ms ease,
          transform 120ms ease;
      }
      .cerca-chip .disco {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: var(--radius-pill);
        background: var(--brand-soft);
        color: var(--brand);
      }
      .cerca-chip:hover:not(.on):not(:disabled) {
        border-style: solid;
        border-color: var(--brand);
        background: var(--surface);
      }
      .cerca-chip:active {
        transform: scale(0.96);
      }
      .cerca-chip:disabled {
        opacity: 0.6;
        cursor: progress;
      }
      .cerca-chip.on {
        border-style: solid;
        border-color: var(--brand);
        background: var(--brand);
        color: var(--on-brand);
      }
      .cerca-chip.on .disco {
        background: var(--surface);
      }
      /* La grilla suma columnas según el ancho disponible, sin saltos por breakpoint. */
      .vt-grid {
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 16px;
      }
      .destacadas {
        padding-inline: 16px;
      }
      .destacadas vt-piece-card {
        width: calc((100% - 3 * 16px) / 4);
        min-width: 190px;
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
        display: block;
        position: sticky;
        top: 24px;
      }
      .mi-avatar {
        display: none;
      }
      .destacadas {
        margin-right: 0;
      }
    }
  `,
})
export class ExplorePage {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(CatalogoPublicoService);
  private readonly detalle = inject(DetalleDialogo);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  protected readonly destacadas = this.api.destacadas();
  protected readonly piezasDestacadas = computed(() =>
    this.destacadas.hasValue() ? this.destacadas.value().items : [],
  );
  protected readonly idsDestacadas = computed(() => this.piezasDestacadas().map((p) => p.id));
  private readonly riel = viewChild<ElementRef<HTMLElement>>('riel');
  protected readonly hayAtras = signal(false);
  protected readonly hayAdelante = signal(false);
  private solicitud?: Subscription;
  private espera?: ReturnType<typeof setTimeout>;
  protected readonly esqueleto = [1, 2, 3, 4];
  protected readonly filtros: Filtro[] = ['todas', ...CATEGORIAS.map((c) => c.slug)];
  protected readonly busqueda = signal('');
  protected readonly filtro = signal<Filtro>('todas');
  protected readonly resultados = signal<PiezaPublica[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(false);
  protected readonly error = signal(false);
  protected desplazamiento = 0;

  // Funciones del celular
  protected readonly dispositivo = inject(DispositivoService);
  private readonly toast = inject(ToastService);
  /** Código de barras escaneado: filtra las piezas con ese mismo código. */
  protected readonly codigo = signal('');
  /** Ubicación actual cuando está activo «Cerca de mí». */
  protected readonly cerca = signal<{ latitud: number; longitud: number } | null>(null);
  protected readonly escaneando = signal(false);
  protected readonly ubicando = signal(false);
  protected readonly sorprendiendo = signal(false);
  protected readonly sensorActivo = signal(false);
  /** Radio de «Cerca de mí», en km. */
  protected readonly radioKm = signal<number>(10);
  protected readonly radios = RADIOS_KM;
  /** Pieza que salió con «Sorpréndeme»: se muestra en una hoja antes de abrirla. */
  protected readonly sorpresa = signal<PiezaPublica | null>(null);
  private dejarDeEscuchar?: () => void;
  private ultimaSorpresa?: number;

  constructor() {
    effect(() => {
      this.detalle.lista.set(this.resultados().map((p) => p.id));
      this.detalle.restaurar();
    });
    effect(() => {
      this.piezasDestacadas();
      this.medirRiel();
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      clearTimeout(this.espera);
      this.busqueda.set(params.get('q') ?? '');
      this.filtro.set(this.filtros.find((f) => f === params.get('categoria')) ?? 'todas');
      this.codigo.set(params.get('codigo') ?? '');
      this.reiniciar();
    });
    this.destroy.onDestroy(() => {
      clearTimeout(this.espera);
      this.solicitud?.unsubscribe();
      this.dejarDeEscuchar?.();
    });
    // Acelerómetro: en la app, agitar el celular abre una pieza al azar.
    if (this.dispositivo.nativa) {
      this.dispositivo
        .escucharSacudidas(() => this.sorprender())
        .then((detener) => {
          if (this.destroy.destroyed) return detener();
          this.dejarDeEscuchar = detener;
          this.sensorActivo.set(true);
          this.avisarSacudida();
        })
        .catch((e) => {
          const mensaje = mensajeDispositivo(e);
          if (mensaje) this.toast.show(mensaje, 'info');
        });
    }
  }

  /** Cámara: QR de Vitrina → abre la pieza o el perfil; código de barras → busca ese producto. */
  protected async escanear(): Promise<void> {
    this.escaneando.set(true);
    try {
      const leido = interpretarCodigo(
        await this.dispositivo.escanear(() =>
          this.toast.show('Preparando el lector de códigos… se descarga una sola vez.', 'info'),
        ),
      );
      if (leido.tipo === 'pieza') {
        void this.router.navigate(['/pieza', leido.id]);
      } else if (leido.tipo === 'coleccionista') {
        void this.router.navigate(['/coleccionistas', leido.username]);
      } else {
        this.cerca.set(null);
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: null, categoria: null, codigo: leido.codigo },
        });
      }
    } catch (e) {
      const mensaje = mensajeDispositivo(e);
      if (mensaje) this.toast.show(mensaje, 'danger');
    } finally {
      this.escaneando.set(false);
    }
  }

  protected quitarCodigo(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { codigo: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** GPS: muestra las piezas conseguidas cerca, ordenadas por distancia. */
  protected async alternarCerca(): Promise<void> {
    if (this.cerca()) {
      this.cerca.set(null);
      this.reiniciar();
      return;
    }
    this.ubicando.set(true);
    try {
      const { latitud, longitud } = await this.dispositivo.ubicacion();
      this.cerca.set({ latitud, longitud });
      this.reiniciar();
    } catch (e) {
      const mensaje = mensajeDispositivo(e);
      if (mensaje) this.toast.show(mensaje, 'danger');
    } finally {
      this.ubicando.set(false);
    }
  }

  protected cambiarRadio(km: number): void {
    this.radioKm.set(km);
    this.reiniciar();
  }

  /** Siguiente radio más amplio, para ofrecerlo cuando no hay resultados. */
  protected radioSiguiente(): number | undefined {
    return RADIOS_KM.find((r) => r > this.radioKm());
  }

  /** Sin botón: se avisa una vez por sesión que la sorpresa llega al agitar el celular. */
  private avisarSacudida(): void {
    try {
      if (sessionStorage.getItem('vt-aviso-sacudida')) return;
      sessionStorage.setItem('vt-aviso-sacudida', '1');
    } catch {
      /* sin almacenamiento: se avisa igual */
    }
    this.toast.show('Agita el celular para descubrir una pieza sorpresa', 'info');
  }

  /** Pide una pieza al azar y la muestra en una hoja (al agitar el celular). */
  protected sorprender(): void {
    if (this.sorprendiendo()) return;
    this.sorprendiendo.set(true);
    this.api
      .aleatoria(this.sorpresa()?.id ?? this.ultimaSorpresa)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (pieza) => {
          this.sorprendiendo.set(false);
          this.ultimaSorpresa = pieza.id;
          this.sorpresa.set(pieza);
          navigator.vibrate?.([40, 50, 40]);
        },
        error: () => {
          this.sorprendiendo.set(false);
          this.toast.show('No pudimos traer una pieza al azar. Revisa tu conexión.', 'danger');
        },
      });
  }

  protected verSorpresa(): void {
    const pieza = this.sorpresa();
    this.sorpresa.set(null);
    if (pieza) void this.router.navigate(['/pieza', pieza.id]);
  }

  /** Con «/» el cursor salta al buscador, como en otros sitios. */
  protected atajo(evento: KeyboardEvent): void {
    if (evento.key !== '/' || evento.ctrlKey || evento.metaKey || evento.altKey) return;
    if ((evento.target as HTMLElement).closest('input, textarea, [contenteditable]')) return;
    const campo = document.querySelector<HTMLInputElement>('vt-search-field input');
    if (!campo) return;
    evento.preventDefault();
    campo.focus();
  }

  protected medirRiel(): void {
    const riel = this.riel()?.nativeElement;
    if (!riel) return;
    this.hayAtras.set(riel.scrollLeft > 4);
    this.hayAdelante.set(riel.scrollLeft + riel.clientWidth < riel.scrollWidth - 4);
  }

  protected mover(direccion: 1 | -1): void {
    const riel = this.riel()?.nativeElement;
    if (!riel) return;
    const [primera, segunda] = Array.from(riel.children) as HTMLElement[];
    const paso = segunda ? segunda.offsetLeft - primera.offsetLeft : riel.clientWidth;
    riel.scrollBy({ left: direccion * paso });
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
    this.cerca.set(null);
    if (this.codigo()) {
      void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      return;
    }
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
        codigo: this.codigo() || null,
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
      .listar(this.busqueda(), this.filtro(), this.desplazamiento, {
        codigo: this.codigo() || undefined,
        cerca: this.cerca() ? { ...this.cerca()!, radioKm: this.radioKm() } : undefined,
      })
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
