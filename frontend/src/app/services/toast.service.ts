import { Injectable, signal } from '@angular/core';

export type ToastTono = 'info' | 'success' | 'danger';

export interface ToastMsg {
  texto: string;
  tono: ToastTono;
  accion?: { texto: string; fn: () => void };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly actual = signal<ToastMsg | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(texto: string, tono: ToastTono = 'info', accion?: ToastMsg['accion']): void {
    clearTimeout(this.timer);
    this.actual.set({ texto, tono, accion });
    this.timer = setTimeout(() => this.cerrar(), tono === 'danger' ? 6000 : 3200);
  }

  cerrar(): void {
    clearTimeout(this.timer);
    this.actual.set(null);
  }
}
