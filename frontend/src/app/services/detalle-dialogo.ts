import { Location } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DatosDialogoPieza, PieceDialog } from '../components/piece-dialog';
import { Pantalla } from './pantalla';

/**
 * Abre el detalle de una pieza en una ventana sobre la lista, como en Instagram web.
 * La dirección cambia a /pieza/:id; al cerrar vuelve a la anterior. En el teléfono no hace nada
 * y el enlace lleva a la página de siempre.
 */
@Injectable({ providedIn: 'root' })
export class DetalleDialogo {
  private readonly dialogo = inject(MatDialog);
  private readonly location = inject(Location);
  private readonly pantalla = inject(Pantalla);

  /** Piezas de la lista visible; la página que la muestra la registra. */
  readonly lista = signal<number[]>([]);

  /** Devuelve true si abrió la ventana; si no, el enlace debe seguir su curso. */
  abrir(id: number): boolean {
    if (!this.pantalla.escritorio()) return false;
    if (this.dialogo.openDialogs.length) return true;
    this.location.go(`/pieza/${id}`);
    const ref = this.dialogo.open<PieceDialog, DatosDialogoPieza, string>(PieceDialog, {
      data: { id, ids: this.lista() },
      panelClass: 'vt-pieza-dialogo',
      backdropClass: 'vt-pieza-fondo',
      width: 'min(1120px, calc(100vw - 280px))',
      height: 'min(800px, calc(100dvh - 80px))',
      maxWidth: 'none',
      autoFocus: 'dialog',
      ariaLabel: 'Detalle de la pieza',
    });
    ref.afterClosed().subscribe((resultado) => {
      // Si se fue a otra página, esa navegación ya cambió la dirección: no hay que retroceder.
      if (resultado !== 'navegar' && this.location.path().startsWith('/pieza/'))
        this.location.back();
    });
    return true;
  }
}
