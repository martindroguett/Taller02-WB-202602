import { Location } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { IconButton } from './icon-button';

@Component({
  selector: 'vt-top-bar',
  imports: [IconButton],
  host: { '[class.small]': 'small()' },
  template: `
    @if (small()) {
      <button
        type="button"
        vt-icon-button
        tone="surface"
        [icon]="icono()"
        [label]="icono() === 'close' ? 'Cerrar' : 'Volver'"
        (click)="volver()"
      ></button>
      <h1 class="chico">{{ titulo() }}</h1>
      <span class="relleno"><ng-content /></span>
    } @else {
      <div>
        @if (subtitulo()) {
          <p class="vt-muted saludo">{{ subtitulo() }}</p>
        }
        <h1 class="display-lg">{{ titulo() }}</h1>
      </div>
      <span class="relleno"><ng-content /></span>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      min-height: 52px;
    }
    h1 {
      min-width: 0;
    }
    .saludo {
      margin-bottom: 3px;
      font: var(--text-body);
    }
    .chico {
      flex: 1;
      font: var(--text-body-strong);
      text-align: center;
    }
    .relleno {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      min-width: var(--tap-target);
      justify-content: flex-end;
    }
  `,
})
export class TopBar {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly small = input(false);
  readonly icono = input<'arrow_back' | 'close'>('arrow_back');

  protected volver(): void {
    if (window.history.state?.navigationId > 1) this.location.back();
    else this.router.navigateByUrl('/perfil');
  }
}
