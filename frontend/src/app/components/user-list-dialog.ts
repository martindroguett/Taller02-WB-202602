import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { UsuariosPublicosService } from '../services/usuarios-publicos.service';
import { Avatar } from './avatar';
import { Button } from './button';

export type TipoLista = 'seguidores' | 'seguidos';

/** Abre la lista de seguidores o de seguidos de un usuario. Se usa desde las cabeceras de perfil. */
export function abrirListaUsuarios(dialogo: MatDialog, username: string, tipo: TipoLista): void {
  dialogo.open(UserListDialog, {
    data: { username, tipo },
    width: '420px',
    autoFocus: 'dialog',
    ariaLabel: tipo === 'seguidores' ? 'Seguidores' : 'Siguiendo',
  });
}

@Component({
  selector: 'vt-user-list-dialog',
  imports: [Avatar, Button, MatDialogModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <h2 class="title">{{ datos.tipo === 'seguidores' ? 'Seguidores' : 'Siguiendo' }}</h2>
    <mat-dialog-content>
      @if (lista.error()) {
        <p role="alert">No pudimos cargar la lista.</p>
        <button vt-button type="button" (click)="lista.reload()">Reintentar</button>
      } @else if (lista.hasValue()) {
        @for (u of lista.value().items; track u.id) {
          <a class="usuario" [routerLink]="['/coleccionistas', u.username]" mat-dialog-close>
            <vt-avatar [nombre]="u.username" [tam]="40" />
            <span>&#64;{{ u.username }}</span>
          </a>
        } @empty {
          <p class="vt-muted">
            {{
              datos.tipo === 'seguidores'
                ? 'Todavía no tiene seguidores.'
                : 'Todavía no sigue a nadie.'
            }}
          </p>
        }
        @if (lista.value().total > lista.value().items.length) {
          <button vt-button variant="secondary" type="button" (click)="limite.set(limite() + 20)">
            Mostrar más
          </button>
        }
      } @else {
        <div class="cargando" role="status"><mat-spinner diameter="28" /> Cargando…</div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button vt-button variant="secondary" type="button" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    h2 {
      margin: 0;
      padding: var(--space-5) var(--space-6) var(--space-2);
    }
    .usuario {
      font: var(--text-body-strong);
      color: var(--ink);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: var(--tap-target);
    }
    .usuario:hover {
      color: var(--brand);
    }
    .cargando {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
  `,
})
export class UserListDialog {
  protected readonly datos = inject<{ username: string; tipo: TipoLista }>(MAT_DIALOG_DATA);
  private readonly api = inject(UsuariosPublicosService);
  protected readonly limite = signal(20);
  protected readonly lista =
    this.datos.tipo === 'seguidores'
      ? this.api.seguidores(() => this.datos.username, this.limite)
      : this.api.seguidos(
          () => this.datos.username,
          () => 0,
          this.limite,
        );
}
