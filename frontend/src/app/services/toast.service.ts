import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ToastTono = 'info' | 'success' | 'danger';

export interface ToastMsg {
  texto: string;
  tono: ToastTono;
  accion?: { texto: string; fn: () => void };
}

/** Avisos breves sobre la pantalla, con el MatSnackBar de Angular Material. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(texto: string, tono: ToastTono = 'info', accion?: ToastMsg['accion']): void {
    const aviso = this.snackBar.open(texto, accion?.texto, {
      duration: tono === 'danger' ? 6000 : 3200,
      panelClass: ['vt-aviso', `vt-aviso-${tono}`],
      politeness: tono === 'danger' ? 'assertive' : 'polite',
    });
    if (accion) aviso.onAction().subscribe(accion.fn);
  }

  cerrar(): void {
    this.snackBar.dismiss();
  }
}
