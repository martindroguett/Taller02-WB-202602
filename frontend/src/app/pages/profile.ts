import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Button } from '../components/button';
import { EmptyState } from '../components/empty-state';
import { PieceCard } from '../components/piece-card';
import { ProfileHeader } from '../components/profile-header';
import { Tabs } from '../components/tabs';
import { AuthService } from '../services/auth.service';
import { CatalogoService } from '../services/catalogo.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'vt-profile-page',
  imports: [Button, EmptyState, PieceCard, ProfileHeader, RouterLink, Tabs],
  template: `
    @if (usuario(); as u) {
      <div class="vt-screen perfil">
        <vt-profile-header [usuario]="u" [esMio]="esMio()" />
        @if (esMio()) {
          <p>Este perfil muestra datos de demostración.</p>
          <a
            vt-button
            variant="secondary"
            [routerLink]="['/coleccionistas', auth.usuario()?.username]"
            >Ver mi colección real</a
          >
          <button type="button" class="salir caption vt-muted" (click)="cerrarSesion()">
            Cerrar sesión
          </button>
        }

        @if (esMio()) {
          <vt-tabs [opciones]="opciones" etiqueta="Tu perfil" [(valor)]="pestana" />
        } @else {
          <h2 class="title">Colección de &#64;{{ u.username }}</h2>
        }

        @if (lista().length) {
          <div class="filas">
            @for (p of lista(); track p.id) {
              <vt-piece-card variante="row" [pieza]="p"> </vt-piece-card>
            }
          </div>
        } @else if (pestana() === 'favoritos') {
          <vt-empty-state
            titulo="Aún no guardas piezas"
            texto="Toca el marcador de una pieza y la verás aquí."
            categoria="vinilos"
          >
            <a vt-button routerLink="/">Explorar piezas</a>
          </vt-empty-state>
        } @else {
          <vt-empty-state
            [titulo]="esMio() ? 'Tu vitrina está vacía' : 'Esta colección está vacía'"
            texto="Las piezas publicadas aparecerán aquí."
            categoria="cartas"
          >
          </vt-empty-state>
        }
      </div>
    } @else {
      <main class="vt-screen">
        <vt-empty-state
          titulo="No encontramos este perfil"
          texto="Revisa el enlace o descubre otros coleccionistas."
        >
          <a vt-button routerLink="/">Volver a Explorar</a>
        </vt-empty-state>
      </main>
    }
  `,
  styles: `
    .perfil {
      max-width: 720px;
    }
    .filas {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .salir {
      align-self: flex-start;
      min-height: var(--tap-target);
      padding: 0;
      border: 0;
      background: transparent;
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
  `,
})
export class ProfilePage {
  protected readonly auth = inject(AuthService);
  private readonly catalogo = inject(CatalogoService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Parámetro de ruta :usuario; sin él, es tu perfil. */
  readonly usuarioHandle = input<string>(undefined, { alias: 'usuario' });

  protected readonly opciones = [
    { id: 'coleccion', texto: 'Mi colección' },
    { id: 'favoritos', texto: 'Favoritos' },
  ];
  protected readonly pestana = signal('coleccion');

  protected readonly usuario = computed(() =>
    this.usuarioHandle() ? this.catalogo.usuarioPorHandle(this.usuarioHandle()!) : this.catalogo.yo,
  );
  protected readonly esMio = computed(() => this.usuario()?.id === this.catalogo.yo.id);

  protected readonly lista = computed(() =>
    this.pestana() === 'favoritos' && this.esMio()
      ? this.catalogo.favoritas()
      : this.catalogo.recientes().filter((p) => p.duenoId === this.usuario()?.id),
  );

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.toast.show('Cerraste sesión.');
    this.router.navigateByUrl('/');
  }
}
