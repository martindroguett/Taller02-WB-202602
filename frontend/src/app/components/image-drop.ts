import { Component, inject, model } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { Icon } from './icon';
import { IconButton } from './icon-button';

const MAX_MB = 5;

@Component({
  selector: 'vt-image-drop',
  imports: [Icon, IconButton],
  template: `
    @if (imagen(); as src) {
      <div class="vista">
        <img [src]="src" alt="Foto de tu pieza" />
        <button
          type="button"
          vt-icon-button
          class="quitar"
          tone="glass"
          icon="close"
          label="Quitar foto"
          (click)="imagen.set(null)"
        ></button>
      </div>
    } @else {
      <label class="zona">
        <span class="mas"><vt-icon name="add" [size]="28" /></span>
        <span class="body-strong">Sube una foto de tu pieza</span>
        <span class="caption vt-muted">JPG, PNG o WebP, hasta {{ max }} MB</span>
        <input
          class="vt-sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          (change)="elegir($event)"
        />
      </label>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .zona {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      min-height: 200px;
      padding: var(--space-5);
      border: 2px dashed var(--line-strong);
      border-radius: var(--radius-lg);
      background: var(--surface);
      text-align: center;
      cursor: pointer;
    }
    .zona:focus-within {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }
    .mas {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      margin-bottom: var(--space-2);
      border-radius: 34%;
      background: var(--brand);
      color: var(--on-brand);
      transform: rotate(-8deg);
    }
    .vista {
      position: relative;
      aspect-ratio: 5 / 4;
      overflow: hidden;
      border: 6px solid var(--surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
    }
    .vista img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .quitar {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
    }
  `,
})
export class ImageDrop {
  private readonly toast = inject(ToastService);
  protected readonly max = MAX_MB;
  readonly imagen = model<string | null>(null);

  protected elegir(ev: Event): void {
    const archivo = (ev.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.toast.show('Elige una foto JPG, PNG o WebP.', 'danger');
      return;
    }
    if (archivo.size > MAX_MB * 1024 * 1024) {
      this.toast.show(`La foto pesa más de ${MAX_MB} MB: elige una más liviana.`, 'danger');
      return;
    }
    const lector = new FileReader();
    lector.onload = () => this.imagen.set(lector.result as string);
    lector.onerror = () => this.toast.show('No pudimos leer la foto. Intenta con otra.', 'danger');
    lector.readAsDataURL(archivo);
  }
}
