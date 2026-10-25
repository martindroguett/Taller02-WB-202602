import { Component, computed, inject, input } from '@angular/core';
import { CatalogoService } from '../services/catalogo.service';
import { Button } from './button';

@Component({
  selector: 'vt-follow-button',
  imports: [Button],
  template: `
    <button
      type="button"
      vt-button
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
    }
  `,
})
export class FollowButton {
  protected readonly catalogo = inject(CatalogoService);
  readonly usuarioId = input.required<number>();
  protected readonly siguiendo = computed(() => this.catalogo.siguiendo().has(this.usuarioId()));
}
