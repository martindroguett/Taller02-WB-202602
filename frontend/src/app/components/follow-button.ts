import { Component, computed, inject, input } from '@angular/core';
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
      (click)="catalogo.toggleSeguir(usuarioId())"
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
  protected readonly siguiendo = computed(() => this.catalogo.siguiendo().has(this.usuarioId()));
}
