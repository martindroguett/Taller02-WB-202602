import { Component, computed, inject, input } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { CatalogoService } from '../services/catalogo.service';
import { Button } from './button';

@Component({
  selector: 'vt-follow-button',
  imports: [Button],
  host: { '[attr.data-size]': 'size()' },
  template: `
    <button
      type="button"
      vt-button
      [size]="size()"
      [variant]="siguiendo() ? 'secondary' : 'primary'"
      [icon]="siguiendo() ? 'check' : 'person_add'"
      [attr.aria-pressed]="siguiendo()"
      [attr.aria-label]="pendiente() ? 'Seguir: pendiente de conectar' : null"
      [title]="pendiente() ? 'Pendiente de conectar' : ''"
      (click)="alternar()"
    >
      {{ siguiendo() ? 'Siguiendo' : 'Seguir' }}
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      width: 148px;
    }
    :host([data-size='sm']) {
      width: 128px;
    }
    button {
      width: 100%;
      white-space: nowrap;
    }
  `,
})
export class FollowButton {
  protected readonly catalogo = inject(CatalogoService);
  readonly usuarioId = input.required<number>();
  readonly size = input<'sm' | 'md'>('md');
  readonly pendiente = input(false);
  private readonly toast = inject(ToastService);
  protected readonly siguiendo = computed(
    () => !this.pendiente() && this.catalogo.siguiendo().has(this.usuarioId()),
  );
  protected alternar(): void {
    if (this.pendiente()) this.toast.show('Seguir está pendiente de conectar');
    else this.catalogo.toggleSeguir(this.usuarioId());
  }
}
