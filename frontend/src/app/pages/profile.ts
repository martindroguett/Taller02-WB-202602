import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { abrirCuenta, abrirEditarPerfil } from '../components/cuenta-sheet';
import { IconButton } from '../components/icon-button';
import { Icon } from '../components/icon';
import { Tabs } from '../components/tabs';
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
  imports: [
    Button,
    EmptyState,
    Icon,
    IconButton,
    MatProgressSpinnerModule,
    PieceCard,
    ProfileHeader,
    RouterLink,
    Tabs,
  ],
  template: `
    <div class="vt-screen perfil">
      <div class="barra">
        <vt-tabs [opciones]="vistas" etiqueta="Cómo ver tu perfil" [(valor)]="vista" />
        <button
          type="button"
          vt-icon-button
          tone="surface"
          icon="tune"
          label="Tu cuenta y ajustes"
          (click)="cuenta()"
        ></button>
      </div>
      @if (vista() === 'publica') {
        <p class="aviso" role="status">
          <vt-icon name="visibility" [size]="20" />
          Así te ve cualquier visita. Tu correo y tus ajustes no se muestran.
        </p>
      }
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
        <vt-profile-header
          class="cabecera"
          [usuario]="usuario"
          [propio]="vista() === 'mia'"
          [vistaPrevia]="vista() === 'publica'"
          [piezas]="total()"
          [abanico]="abanico()"
          (verPiezas)="coleccion.scrollIntoView({ behavior: 'smooth' })"
          (editar)="editar()"
        />

        <section class="vt-section" aria-labelledby="coleccion-titulo" #coleccion>
          <h2 class="title" id="coleccion-titulo">
            {{ vista() === 'mia' ? 'Mi colección' : 'Colección' }}
          </h2>
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
    </div>
  `,
  styles: `
    .perfil {
      max-width: 720px;
    }
    .barra {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .barra vt-tabs {
      flex: 1;
    }
    .aviso {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: var(--space-3) 0 0;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      background: var(--night);
      color: var(--on-night);
      font: var(--text-label);
    }
    @media (min-width: 1000px) {
      .perfil {
        max-width: var(--content-max);
        padding-top: var(--space-6);
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
export class ProfilePage {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(UsuariosPublicosService);
  private readonly detalle = inject(DetalleDialogo);
  private readonly dialogo = inject(MatDialog);
  protected readonly vistas = [
    { id: 'mia', texto: 'Mi perfil' },
    { id: 'publica', texto: 'Como te ven' },
  ];
  protected readonly vista = signal('mia');
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
  constructor() {
    effect(() => {
      this.detalle.lista.set(
        this.piezas.hasValue() ? this.piezas.value().items.map((p) => p.id) : [],
      );
      this.detalle.restaurar();
    });
  }

  protected cuenta(): void {
    abrirCuenta(this.dialogo);
  }

  protected editar(): void {
    abrirEditarPerfil(this.dialogo)
      .afterClosed()
      .subscribe((guardado) => guardado && this.perfil.reload());
  }
}
