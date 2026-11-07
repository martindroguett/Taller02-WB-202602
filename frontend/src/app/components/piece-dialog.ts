import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import { Button } from './button';
import { EmptyState } from './empty-state';
import { IconButton } from './icon-button';
import { PieceDetail } from './piece-detail';

export interface DatosDialogoPieza {
  id: number;
  /** Piezas de la lista que se está viendo, para pasar a la anterior o a la siguiente. */
  ids: number[];
}

/** Ventana con el detalle de la pieza sobre Explorar o un perfil, con flechas entre piezas. */
@Component({
  selector: 'vt-piece-dialog',
  imports: [Button, EmptyState, IconButton, PieceDetail],
  host: {
    '(document:keydown.arrowleft)': 'teclado($event, -1)',
    '(document:keydown.arrowright)': 'teclado($event, 1)',
  },
  template: `
    <div class="marco" role="dialog" aria-modal="true" aria-label="Detalle de la pieza">
      @if (pieza.hasValue()) {
        <vt-piece-detail [pieza]="pieza.value()" modo="ventana" (irA)="ref.close('navegar')" />
      } @else if (pieza.error()) {
        <div class="vacio">
          <vt-empty-state
            titulo="No pudimos cargar la pieza"
            texto="Comprueba tu conexión e inténtalo de nuevo."
            ><button type="button" vt-button (click)="pieza.reload()">
              Reintentar
            </button></vt-empty-state
          >
        </div>
      } @else {
        <div class="vacio" role="status" aria-label="Cargando pieza">
          <div class="vt-esqueleto cargando"></div>
        </div>
      }
    </div>
    <button
      type="button"
      vt-icon-button
      class="fuera cerrar"
      tone="surface"
      icon="close"
      label="Cerrar"
      (click)="ref.close()"
    ></button>
    @if (indice() > 0) {
      <button
        type="button"
        vt-icon-button
        class="fuera atras"
        tone="surface"
        icon="chevron_left"
        label="Pieza anterior"
        (click)="mover(-1)"
      ></button>
    }
    @if (indice() >= 0 && indice() < datos.ids.length - 1) {
      <button
        type="button"
        vt-icon-button
        class="fuera adelante"
        tone="surface"
        icon="chevron_right"
        label="Pieza siguiente"
        (click)="mover(1)"
      ></button>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      height: 100%;
    }
    .marco {
      height: 100%;
    }
    .vacio {
      height: 100%;
      display: grid;
      place-items: center;
      background: var(--surface);
      border-radius: var(--radius-xl);
    }
    .cargando {
      width: 100%;
      height: 100%;
      border-radius: var(--radius-xl);
    }
    /* Los controles quedan fuera de la caja blanca, sobre el fondo oscuro. */
    .fuera {
      position: absolute;
      width: 56px;
      height: 56px;
      box-shadow: var(--shadow-pop);
    }
    .cerrar {
      top: 0;
      right: -76px;
    }
    .atras {
      top: calc(50% - 28px);
      left: -76px;
    }
    .adelante {
      top: calc(50% - 28px);
      right: -76px;
    }
  `,
})
export class PieceDialog {
  protected readonly datos = inject<DatosDialogoPieza>(MAT_DIALOG_DATA);
  protected readonly ref = inject<MatDialogRef<PieceDialog>>(MatDialogRef);
  private readonly location = inject(Location);
  private readonly api = inject(CatalogoPublicoService);
  private readonly id = signal(this.datos.id);
  protected readonly pieza = this.api.detalle(() => String(this.id()));
  protected readonly indice = computed(() => this.datos.ids.indexOf(this.id()));

  protected mover(paso: 1 | -1): void {
    const destino = this.datos.ids[this.indice() + paso];
    if (destino === undefined) return;
    this.id.set(destino);
    // La dirección sigue a la pieza que se ve, sin sumar entradas al historial.
    this.location.replaceState(`/pieza/${destino}`);
  }

  protected teclado(evento: Event, paso: 1 | -1): void {
    const objetivo = evento.target as HTMLElement | null;
    if (objetivo?.closest('input, textarea, [contenteditable]')) return;
    this.mover(paso);
  }
}
