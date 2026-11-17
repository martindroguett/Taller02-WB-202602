import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Button } from './button';
import { Icon } from './icon';

/** «Tu cuenta»: lo que solo ve la persona con sesión (correo, antigüedad) y cerrar sesión. */
export function abrirCuenta(dialogo: MatDialog): void {
  dialogo.open(CuentaSheet, hoja('cuenta-titulo'));
}

/** Hoja para escribir la bio del perfil. */
export function abrirEditarPerfil(dialogo: MatDialog) {
  return dialogo.open(EditarPerfilSheet, hoja('editar-titulo'));
}

function hoja(titulo: string) {
  return {
    panelClass: 'vt-dialogo',
    position: { bottom: '0' },
    width: 'min(100%, 480px)',
    maxWidth: '100vw',
    ariaLabelledBy: titulo,
  };
}

@Component({
  selector: 'vt-cuenta-sheet',
  imports: [Button, Icon, MatDialogModule],
  template: `
    <section class="contenido">
      <h2 class="title" id="cuenta-titulo">Tu cuenta</h2>
      <p class="caption vt-muted">Solo tú ves esto. Tu perfil público no muestra tu correo.</p>
      <div class="fila">
        <span class="ico"><vt-icon name="mail" [size]="20" /></span>
        <span>
          <span class="caption vt-muted">Correo</span>
          <span class="body-strong">{{ auth.usuario()?.email }}</span>
        </span>
      </div>
      <div class="fila">
        <span class="ico"><vt-icon name="calendar_month" [size]="20" /></span>
        <span>
          <span class="caption vt-muted">Miembro desde</span>
          <span class="body-strong">{{ miembroDesde() }}</span>
        </span>
      </div>
      <button type="button" vt-button variant="secondary" icon="logout" class="block" (click)="salir()">
        Cerrar sesión
      </button>
    </section>
  `,
  styles: `
    .contenido {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-5) var(--space-6);
    }
    .fila {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: 56px;
      border-top: 1px solid var(--line);
    }
    .fila > span:last-child {
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .ico {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 34%;
      background: var(--surface-sunken);
    }
    .block {
      margin-top: var(--space-2);
    }
  `,
})
export class CuentaSheet {
  protected readonly auth = inject(AuthService);
  private readonly ref = inject(MatDialogRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected miembroDesde(): string {
    const fecha = this.auth.usuario()?.creado_en;
    return fecha
      ? new Date(fecha).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
      : '';
  }

  protected salir(): void {
    this.ref.close();
    this.auth.cerrarSesion();
    this.toast.show('Cerraste sesión.');
    void this.router.navigateByUrl('/');
  }
}

@Component({
  selector: 'vt-editar-perfil-sheet',
  imports: [Button, FormsModule, MatDialogModule],
  template: `
    <form class="contenido" (ngSubmit)="guardar()">
      <h2 class="title" id="editar-titulo">Editar perfil</h2>
      <label class="label" for="bio">Bio</label>
      <textarea
        id="bio"
        name="bio"
        rows="4"
        maxlength="300"
        placeholder="Qué coleccionas y desde dónde."
        [ngModel]="bio()"
        (ngModelChange)="bio.set($event)"
      ></textarea>
      <p class="caption vt-muted">{{ bio().length }} / 300</p>
      @if (error()) {
        <p role="alert" class="error">{{ error() }}</p>
      }
      <div class="botones">
        <button type="button" vt-button variant="secondary" mat-dialog-close [disabled]="enviando()">
          Cancelar
        </button>
        <button type="submit" vt-button variant="primary" [disabled]="enviando()">
          {{ enviando() ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .contenido {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-5) var(--space-5) var(--space-6);
    }
    textarea {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border: 1.5px solid var(--line-strong);
      border-radius: var(--radius-md);
      background: var(--surface);
      color: var(--ink);
      font: var(--text-body);
      resize: none;
    }
    .error {
      color: var(--danger);
    }
    .botones {
      display: flex;
      gap: var(--space-2);
      margin-top: var(--space-3);
    }
    .botones > * {
      flex: 1;
    }
  `,
})
export class EditarPerfilSheet {
  private readonly auth = inject(AuthService);
  private readonly ref = inject(MatDialogRef);
  private readonly toast = inject(ToastService);
  protected readonly bio = signal(this.auth.usuario()?.bio ?? '');
  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  protected guardar(): void {
    this.enviando.set(true);
    this.error.set('');
    this.auth.actualizarBio(this.bio()).subscribe({
      next: () => {
        this.toast.show('Perfil actualizado.', 'success');
        this.ref.close(true);
      },
      error: () => {
        this.enviando.set(false);
        this.error.set('No pudimos guardar los cambios. Inténtalo de nuevo.');
      },
    });
  }
}
