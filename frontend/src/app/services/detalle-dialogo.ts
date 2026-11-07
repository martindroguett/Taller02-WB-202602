import { Location } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DatosDialogoPieza, PieceDialog } from '../components/piece-dialog';
import { Pantalla } from './pantalla';

/**
 * Abre el detalle de una pieza en una ventana sobre la lista, como en Instagram web.
 * La dirección cambia a /pieza/:id mientras está abierta; al cerrar vuelve a la anterior. En el teléfono no hace nada
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
    const anterior = this.location.path();
    // Solo se cambia la dirección que se ve: no se suma una entrada al historial, así «Volver» desde
    // otra pantalla (por ejemplo, tras editar) lleva a la lista y no a la página de la pieza.
    this.location.replaceState(`/pieza/${id}`);
    const ref = this.dialogo.open<PieceDialog, DatosDialogoPieza, string>(PieceDialog, {
      data: { id, ids: this.lista(), anterior },
      panelClass: 'vt-pieza-dialogo',
      backdropClass: 'vt-pieza-fondo',
      width: 'min(1120px, calc(100vw - 280px))',
      height: 'min(800px, calc(100dvh - 80px))',
      maxWidth: 'none',
      autoFocus: 'dialog',
      ariaLabel: 'Detalle de la pieza',
    });
    ref.afterClosed().subscribe((resultado) => {
      // Si se fue a otra página, la dirección ya se restauró antes de navegar.
      if (resultado !== 'navegar' && this.location.path().startsWith('/pieza/'))
        this.location.replaceState(anterior);
    });
    return true;
  }
}
