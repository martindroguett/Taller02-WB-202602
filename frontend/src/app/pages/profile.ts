import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { PieceCard } from '../components/piece-card';
import { ProfileHeader } from '../components/profile-header';
import { AuthService } from '../services/auth.service';
import { DetalleDialogo } from '../services/detalle-dialogo';
import { ToastService } from '../services/toast.service';
import { UsuariosPublicosService } from '../services/usuarios-publicos.service';

@Component({
  selector: 'vt-profile-page',
  imports: [Button, EmptyState, MatProgressSpinnerModule, PieceCard, ProfileHeader, RouterLink],
  template: `
    <div class="vt-screen perfil">
      @if (perfil.isLoading()) {
        <div class="cargando" role="status"><mat-spinner diameter="28" /> Cargando perfil…</div>
      } @else if (perfil.error()) {
        <vt-empty-state
          titulo="No pudimos cargar tu perfil"
          texto="Comprueba tu conexión e inténtalo de nuevo."
        >
          <button vt-button type="button" (click)="perfil.reload()">Reintentar</button>
        </vt-empty-state>
      } @else if (perfil.value(); as usuario) {
        <vt-profile-header [usuario]="usuario" [piezas]="total()" [abanico]="abanico()" (verPiezas)="coleccion.scrollIntoView({ behavior: 'smooth' })" />

        <section class="cuenta">
          <p>{{ auth.usuario()?.email }}</p>
          <p class="caption vt-muted">Miembro desde {{ miembroDesde() }}</p>
          <div class="enlaces">
            <a vt-button variant="secondary" [routerLink]="['/coleccionistas', usuario.username]"
              >Ver mi perfil público</a
            >
          </div>
        </section>

        <section class="vt-section" aria-labelledby="coleccion-titulo" #coleccion>
          <h2 class="title" id="coleccion-titulo">Mi colección</h2>
          @if (piezas.isLoading()) {
            <div class="cargando" role="status"><mat-spinner diameter="28" /> Cargando piezas…</div>
          } @else if (piezas.error()) {
            <div role="alert">
              <p>No pudimos cargar tus piezas.</p>
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
              <vt-empty-state
                titulo="Tu vitrina está vacía"
                texto="Las piezas que publiques aparecerán aquí."
              >
                <a vt-button variant="accent" icon="add" routerLink="/coleccion/nueva"
                  >Agregar pieza</a
                >
              </vt-empty-state>
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
      <button type="button" class="salir caption vt-muted" (click)="cerrarSesion()">
        Cerrar sesión
      </button>
    </div>
  `,
  styles: `
    .perfil {
      max-width: 720px;
    }
    .cuenta {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
    @media (min-width: 1000px) {
      .perfil {
        max-width: var(--content-max);
        padding-top: var(--space-6);
      }
      .cuenta {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--space-4);
      }
      .enlaces {
        margin: 0 0 0 auto;
      }
      .vt-grid {
        grid-template-columns: repeat(auto-fill, minmax(236px, 1fr));
        gap: var(--space-4);
      }
    }
    .cuenta p {
      margin: 0;
    }
    .enlaces {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-4);
      margin-top: var(--space-3);
    }
    .salir {
      min-height: var(--tap-target);
      padding: 0;
      border: 0;
      background: transparent;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
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
export class ProfilePage {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(UsuariosPublicosService);
  private readonly detalle = inject(DetalleDialogo);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly username = computed(() => this.auth.usuario()?.username ?? '');
  protected readonly desplazamiento = signal(0);
  protected readonly perfil = this.api.perfil(this.username, this.auth.token);
  protected readonly piezas = this.api.piezas(this.username, this.desplazamiento, this.auth.token);

  protected readonly total = computed(() =>
    this.piezas.hasValue() ? this.piezas.value().total : null,
  );
  protected readonly abanico = computed(() =>
    (this.piezas.hasValue() ? this.piezas.value().items : []).slice(0, 3),
  );
  protected readonly miembroDesde = computed(() => {
    const fecha = this.auth.usuario()?.creado_en;
    return fecha
      ? new Date(fecha).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
      : '';
  });

  constructor() {
    effect(() => {
      this.detalle.lista.set(
        this.piezas.hasValue() ? this.piezas.value().items.map((p) => p.id) : [],
      );
      this.detalle.restaurar();
    });
  }

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.toast.show('Cerraste sesión.');
    this.router.navigateByUrl('/');
  }
}
