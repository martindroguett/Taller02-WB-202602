import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { Button } from '../components/button';
import { abrirListaUsuarios } from '../components/user-list-dialog';
import { EmptyState } from '../components/empty-state';
import { PieceCard } from '../components/piece-card';
import { ProfileHeader } from '../components/profile-header';
import { TopBar } from '../components/top-bar';
import { compacto } from '../models/format';
import { AuthService } from '../services/auth.service';
import { DetalleDialogo } from '../services/detalle-dialogo';
import { Pantalla } from '../services/pantalla';
import { ToastService } from '../services/toast.service';
import { UsuariosPublicosService } from '../services/usuarios-publicos.service';

@Component({
  selector: 'vt-public-profile-page',
  imports: [
    Button,
    EmptyState,
    MatProgressSpinnerModule,
    PieceCard,
    ProfileHeader,
    RouterLink,
    TopBar,
  ],
  template: `
    <main class="vt-screen perfil">
      <vt-top-bar [titulo]="'@' + username()" [small]="true" />
      @if (perfil.isLoading()) {
        <div class="cargando" role="status"><mat-spinner diameter="28" /> Cargando perfil…</div>
      } @else if (perfil.error()) {
        @if (noEncontrado()) {
          <vt-empty-state
            titulo="No encontramos este perfil"
            texto="Comprueba el nombre de usuario."
            ><a vt-button routerLink="/">Volver a Explorar</a></vt-empty-state
          >
        } @else {
          <vt-empty-state
            titulo="No pudimos cargar el perfil"
            texto="Comprueba tu conexión e inténtalo de nuevo."
            ><button vt-button type="button" (click)="perfil.reload()">
              Reintentar
            </button></vt-empty-state
          >
        }
      } @else if (perfil.value(); as usuario) {
        <vt-profile-header
          class="cabecera"
          [usuario]="usuario"
          [piezas]="piezas.hasValue() ? piezas.value().total : null"
          [abanico]="piezas.hasValue() ? piezas.value().items.slice(0, 3) : []"
          [enviando]="enviando()"
          (verPiezas)="coleccion.scrollIntoView({ behavior: 'smooth' })"
          (seguir)="alternar()"
        />
        <section class="vt-section" aria-labelledby="piezas-titulo" #coleccion>
          <h2 class="title" id="piezas-titulo">Colección</h2>
          @if (piezas.isLoading()) {
            <div class="cargando" role="status"><mat-spinner diameter="28" /> Cargando piezas…</div>
          } @else if (piezas.error()) {
            <div role="alert">
              <p>No pudimos cargar las piezas.</p>
              <button vt-button type="button" (click)="piezas.reload()">Reintentar</button>
            </div>
          } @else if (piezas.value(); as pagina) {
            @if (pagina.items.length) {
              <div class="vt-grid">
                @for (pieza of pagina.items; track pieza.id) {
                  <vt-piece-card [pieza]="pieza" />
                }
              </div>
            } @else {
              <p>Este coleccionista aún no tiene piezas.</p>
            }
            @if (pagina.total > 20 || desplazamiento() > 0) {
              <nav class="paginacion" aria-label="Páginas de piezas">
                <button
                  vt-button
                  variant="secondary"
                  type="button"
                  [disabled]="desplazamiento() === 0"
                  (click)="desplazamiento.set(desplazamiento() - 20)"
                >
                  Anterior
                </button>
                <span>Página {{ desplazamiento() / 20 + 1 }}</span>
                <button
                  vt-button
                  variant="secondary"
                  type="button"
                  [disabled]="desplazamiento() + 20 >= pagina.total"
                  (click)="desplazamiento.set(desplazamiento() + 20)"
                >
                  Siguiente
                </button>
              </nav>
            }
          }
        </section>
      }
    </main>
  `,
  styles: `
    .perfil {
      padding-top: var(--space-3);
    }
    .cabecera {
      margin-top: 54px;
    }
    @media (min-width: 1000px) {
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
export class PublicProfilePage {
  private readonly api = inject(UsuariosPublicosService);
  private readonly dialogo = inject(MatDialog);
  private readonly detalle = inject(DetalleDialogo);
  protected readonly pantalla = inject(Pantalla);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroy = inject(DestroyRef);
  protected readonly auth = inject(AuthService);
  protected readonly username = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('usuario') ?? '')),
    { initialValue: '' },
  );
  protected readonly desplazamiento = linkedSignal(() => {
    this.username();
    return 0;
  });
  private readonly sesion = computed(() => ({
    token: this.auth.token(),
    usuario: this.auth.usuario(),
  }));
  protected readonly perfil = this.api.perfil(this.username, this.sesion);
  protected readonly piezas = this.api.piezas(this.username, this.desplazamiento, this.sesion);
  protected readonly enviando = signal(false);
  protected readonly compacto = compacto;
  protected readonly giros = [-10, 4, 12];
  protected readonly abanico = computed(() =>
    (this.piezas.hasValue() ? this.piezas.value().items : [])
      .filter((p) => p.imagen_url)
      .slice(0, 3),
  );
  protected readonly avatarTam = computed(() => (this.pantalla.escritorio() ? 120 : 72));
  protected readonly noEncontrado = computed(
    () => (this.perfil.error() as HttpErrorResponse)?.status === 404,
  );
  private version = 0;

  constructor() {
    effect(() => {
      const yo = this.auth.usuario()?.username;
      if (yo && yo === this.username()) void this.router.navigateByUrl('/perfil', { replaceUrl: true });
    });
    effect(() => {
      this.detalle.lista.set(
        this.piezas.hasValue() ? this.piezas.value().items.map((p) => p.id) : [],
      );
      this.detalle.restaurar();
    });
    this.route.paramMap
      .pipe(
        map((params) => params.get('usuario')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe(() => {
        this.version++;
        this.enviando.set(false);
      });
    effect(() => {
      this.sesion();
      this.version++;
      this.enviando.set(false);
    });
  }
  protected verLista(tipo: 'seguidores' | 'seguidos'): void {
    abrirListaUsuarios(this.dialogo, this.username(), tipo);
  }
  protected alternar(): void {
    const usuario = this.perfil.value();
    if (!usuario || this.enviando() || this.auth.usuario()?.id === usuario.id) return;
    if (!this.auth.autenticado()) {
      void this.router.navigate(['/ingresar'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const nombre = this.username();
    const sesion = this.sesion();
    const version = this.version;
    this.enviando.set(true);
    this.api
      .seguir(nombre, usuario.lo_sigo)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (resultado) => {
          if (version !== this.version || nombre !== this.username() || sesion !== this.sesion())
            return;
          this.perfil.value.update((actual) => (actual ? { ...actual, ...resultado } : actual));
          this.enviando.set(false);
          this.toast.show(
            resultado.lo_sigo
              ? 'Ahora sigues a este coleccionista.'
              : 'Dejaste de seguir a este coleccionista.',
            'success',
          );
        },
        error: () => {
          if (version !== this.version || nombre !== this.username() || sesion !== this.sesion())
            return;
          this.enviando.set(false);
          this.toast.show('No pudimos actualizar el seguimiento. Inténtalo de nuevo.', 'danger');
        },
      });
  }
}
