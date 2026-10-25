import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../components/button';
import { ConfirmSheet } from '../components/confirm-sheet';
import { EmptyState } from '../components/empty-state';
import { IconButton } from '../components/icon-button';
import { PieceCard } from '../components/piece-card';
import { ProfileHeader } from '../components/profile-header';
import { Tabs } from '../components/tabs';
import { CatalogoService } from '../services/catalogo.service';
import { ToastService } from '../services/toast.service';
import { Pieza } from '../models/vitrina';

@Component({
  selector: 'vt-profile-page',
  imports: [
    Button,
    ConfirmSheet,
    EmptyState,
    IconButton,
    PieceCard,
    ProfileHeader,
    RouterLink,
    Tabs,
  ],
  template: `
    @if (usuario(); as u) {
      <div class="vt-screen perfil">
        <vt-profile-header [usuario]="u" [esMio]="esMio()" />
        @if (esMio()) {
          <a class="caption vt-muted" routerLink="/ingresar"
            >Ver ingreso y registro de demostración</a
          >
        }

        @if (esMio()) {
          <vt-tabs [opciones]="opciones" etiqueta="Tu perfil" [(valor)]="pestana" />
        } @else {
          <h2 class="title">Colección de &#64;{{ u.username }}</h2>
        }

        @if (lista().length) {
          <div class="filas">
            @for (p of lista(); track p.id) {
              <vt-piece-card variante="row" [pieza]="p">
                @if (esMio() && pestana() === 'coleccion') {
                  <a
                    vt-icon-button
                    icon="edit"
                    label="Editar pieza"
                    tone="sunken"
                    [routerLink]="['/coleccion', p.id, 'editar']"
                  ></a>
                  <button
                    type="button"
                    vt-icon-button
                    icon="delete"
                    label="Eliminar pieza"
                    tone="danger"
                    (click)="porEliminar.set(p)"
                  ></button>
                }
              </vt-piece-card>
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
            @if (esMio()) {
              <a vt-button variant="accent" icon="add" routerLink="/coleccion/nueva"
                >Agregar pieza</a
              >
            }
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
    <vt-confirm-sheet
      [categoria]="porEliminar()?.categoria ?? 'cartas'"
      [abierto]="!!porEliminar()"
      titulo="¿Eliminar esta pieza?"
      [texto]="
        'Vas a quitar «' +
        (porEliminar()?.nombre ?? '') +
        '» de tu colección. No se puede deshacer.'
      "
      (cancelado)="porEliminar.set(null)"
      (confirmado)="eliminar()"
    />
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
  `,
})
export class ProfilePage {
  private readonly catalogo = inject(CatalogoService);
  private readonly toast = inject(ToastService);

  /** Parámetro de ruta :usuario; sin él, es tu perfil. */
  readonly usuarioHandle = input<string>(undefined, { alias: 'usuario' });

  protected readonly opciones = [
    { id: 'coleccion', texto: 'Mi colección' },
    { id: 'favoritos', texto: 'Favoritos' },
  ];
  protected readonly pestana = signal('coleccion');
  protected readonly porEliminar = signal<Pieza | null>(null);

  protected readonly usuario = computed(() =>
    this.usuarioHandle() ? this.catalogo.usuarioPorHandle(this.usuarioHandle()!) : this.catalogo.yo,
  );
  protected readonly esMio = computed(() => this.usuario()?.id === this.catalogo.yo.id);

  protected readonly lista = computed(() =>
    this.pestana() === 'favoritos' && this.esMio()
      ? this.catalogo.favoritas()
      : this.catalogo.recientes().filter((p) => p.duenoId === this.usuario()?.id),
  );

  protected eliminar(): void {
    const p = this.porEliminar();
    if (!p) return;
    this.catalogo.eliminar(p.id);
    this.porEliminar.set(null);
    this.toast.show('Pieza eliminada', 'success');
  }
}
