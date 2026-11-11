import { Location } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { MatDialog, MatDialogState } from '@angular/material/dialog';
import { NavigationStart, Router } from '@angular/router';
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
  private readonly router = inject(Router);
  private readonly pantalla = inject(Pantalla);

  /** Piezas de la lista visible; la página que la muestra la registra. */
  readonly lista = signal<number[]>([]);
  /** Pieza desde la que se salió a otra pantalla (editar, perfil): al volver a la lista se reabre su ventana. */
  private ultima: number | null = null;
  private origen = '';

  /** Lleva la vista hasta la tarjeta de la última pieza abierta, si ya está en pantalla. */
  restaurar(): void {
    const id = this.ultima;
    // Solo en la pantalla desde la que se abrió la pieza.
    if (id === null || this.location.path() !== this.origen) return;
    // La lista se dibuja un poco después de que llegan los datos: se reintenta unos instantes.
    let intentos = 0;
    const buscar = () => {
      const tarjeta = document.querySelector(`[data-pieza="${id}"]`);
      if (tarjeta) {
        if (this.ultima !== id) return;
        this.ultima = null;
        tarjeta.scrollIntoView({ block: 'center' });
        // Se vuelve a la pieza que se tenía abierta, como estaba antes de salir.
        this.abrir(id);
      } else if (++intentos < 10 && this.ultima === id) {
        setTimeout(buscar, 100);
      }
    };
    setTimeout(buscar, 50);
  }

  /** Conserva la lista de fondo al pedir ingreso desde una ventana de pieza. */
  destinoParaIngresar(): { returnUrl: string; pieza?: number } {
    const ref = this.dialogo.openDialogs.find(
      (dialogo) => dialogo.componentInstance instanceof PieceDialog,
    );
    const id = this.location.path().match(/^\/pieza\/(\d+)$/)?.[1];
    return ref && id
      ? { returnUrl: (ref.componentInstance as PieceDialog).datosOrigen, pieza: Number(id) }
      : { returnUrl: this.location.path() };
  }

  /** Devuelve true si abrió la ventana; si no, el enlace debe seguir su curso. */
  abrir(id: number, ids = this.lista()): boolean {
    if (!this.pantalla.escritorio()) return false;
    if (this.dialogo.openDialogs.length) return true;
    const anterior = this.location.path();
    this.ultima = id;
    this.origen = anterior;
    // Solo se cambia la dirección que se ve: no se suma una entrada al historial, así «Volver» desde
    // otra pantalla (por ejemplo, tras editar) lleva a la lista y no a la página de la pieza.
    this.location.replaceState(`/pieza/${id}`);
    const ref = this.dialogo.open<PieceDialog, DatosDialogoPieza, string>(PieceDialog, {
      data: { id, ids, anterior },
      panelClass: 'vt-pieza-dialogo',
      backdropClass: 'vt-pieza-fondo',
      width: 'min(1120px, calc(100vw - 280px))',
      height: 'min(800px, calc(100dvh - 80px))',
      maxWidth: 'none',
      autoFocus: 'dialog',
      ariaLabel: 'Detalle de la pieza',
    });
    const navegacion = this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationStart && ref.getState() === MatDialogState.OPEN) {
        // En una navegación del historial, el navegador ya cambió la dirección.
        if (evento.navigationTrigger === 'imperative') this.location.replaceState(anterior);
        ref.close('salir');
      }
    });
    ref.afterClosed().subscribe((resultado) => {
      navegacion.unsubscribe();
      // Si se cerró sin salir de la lista, no hay nada que restaurar.
      if (resultado !== 'navegar') this.ultima = null;
      // Las navegaciones ya restauraron la dirección antes de cerrar.
      if (!resultado && this.location.path().startsWith('/pieza/'))
        this.location.replaceState(anterior);
    });
    return true;
  }
}
