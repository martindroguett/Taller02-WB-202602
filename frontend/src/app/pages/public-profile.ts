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
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { Avatar } from '../components/avatar';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { PieceCard } from '../components/piece-card';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UsuariosPublicosService } from '../services/usuarios-publicos.service';

@Component({
  selector: 'vt-public-profile-page',
  imports: [
    Avatar,
    Button,
    EmptyState,
    MatButtonModule,
    MatProgressSpinnerModule,
    PieceCard,
    RouterLink,
  ],
  template: `
    <main class="vt-screen perfil">
      <a routerLink="/">← Explorar</a>
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
        <header class="cabecera">
          <vt-avatar [nombre]="usuario.username" [tam]="72" anillo="brand" />
          <div>
            <h1 class="title">&#64;{{ usuario.username }}</h1>
            <p>{{ usuario.bio }}</p>
          </div>
          <div class="cifras">
            <span
              ><strong>{{ usuario.seguidores }}</strong> seguidores</span
            ><span
              ><strong>{{ usuario.siguiendo }}</strong> siguiendo</span
            >
          </div>
          @if (auth.usuario()?.id !== usuario.id) {
            <button
              mat-flat-button
              type="button"
              [attr.aria-pressed]="usuario.lo_sigo"
              [disabled]="enviando()"
              (click)="alternar()"
            >
              {{ enviando() ? 'Actualizando…' : usuario.lo_sigo ? 'Siguiendo' : 'Seguir' }}
            </button>
          }
        </header>
        <section class="vt-section" aria-labelledby="piezas-titulo">
          <h2 class="title" id="piezas-titulo">Piezas</h2>
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
      max-width: 960px;
      margin-inline: auto;
      padding-top: var(--space-5);
    }
    button[mat-flat-button] {
      font: var(--text-label);
      min-height: var(--tap-target);
    }
    .cabecera {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-4);
      padding-block: var(--space-6);
    }
    .cabecera > div:nth-child(2) {
      flex: 1;
      min-width: 180px;
      overflow-wrap: anywhere;
    }
    .cifras {
      display: flex;
      gap: var(--space-4);
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
  protected readonly noEncontrado = computed(
    () => (this.perfil.error() as HttpErrorResponse)?.status === 404,
  );
  private version = 0;

  constructor() {
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
