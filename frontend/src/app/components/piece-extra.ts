import { Component, computed, input, signal } from '@angular/core';
import { toDataURL } from 'qrcode';
import { environment } from '../../environments/environment';
import { PiezaPublica } from '../services/catalogo-publico.service';
import { Button } from './button';
import { Icon } from './icon';

/** Enlace público de una pieza: es lo que se comparte y lo que lleva su QR. */
export const enlacePieza = (id: number): string => `${environment.sitioUrl}/pieza/${id}`;

/**
 * Datos de la pieza que vienen del celular: el código escaneado, dónde se consiguió
 * y un QR propio para que otra persona la abra escaneándolo desde la app.
 */
@Component({
  selector: 'vt-piece-extra',
  imports: [Button, Icon],
  template: `
    @let p = pieza();
    @if (p.codigo || p.latitud !== null) {
      <ul class="datos caption">
        @if (p.codigo) {
          <li><vt-icon name="barcode" [size]="18" /> Código {{ p.codigo }}</li>
        }
        @if (p.latitud !== null && p.longitud !== null) {
          <li>
            <vt-icon name="location_on" [size]="18" />
            <a [href]="mapa()" target="_blank" rel="noopener">{{ p.lugar || 'Ver en el mapa' }}</a>
          </li>
        }
      </ul>
    }
    <button
      type="button"
      vt-button
      size="sm"
      variant="secondary"
      icon="qr_code_2"
      [attr.aria-expanded]="!!qr()"
      (click)="alternarQr()"
    >
      {{ qr() ? 'Ocultar QR' : 'Mostrar QR' }}
    </button>
    @if (qr()) {
      <figure class="qr">
        <img [src]="qr()" alt="Código QR de la pieza" width="200" height="200" />
        <figcaption class="caption vt-muted">
          Escanéalo con «Escanear» en Explorar para abrir esta pieza.
        </figcaption>
      </figure>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-2);
    }
    .datos {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
      overflow-wrap: anywhere;
    }
    .datos li {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .datos a {
      color: var(--brand);
      font-weight: 700;
    }
    .qr {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      margin: 0;
      padding: var(--space-3);
      border-radius: var(--radius-lg);
      background: #fff;
    }
  `,
})
export class PieceExtra {
  readonly pieza = input.required<PiezaPublica>();
  protected readonly qr = signal('');
  protected readonly mapa = computed(() => {
    const { latitud, longitud } = this.pieza();
    // En el celular abre la app de Google Maps; en el navegador, su sitio. No necesita clave.
    return `https://www.google.com/maps/search/?api=1&query=${latitud},${longitud}`;
  });

  protected async alternarQr(): Promise<void> {
    if (this.qr()) {
      this.qr.set('');
      return;
    }
    this.qr.set(await toDataURL(enlacePieza(this.pieza().id), { width: 400, margin: 1 }));
  }
}
