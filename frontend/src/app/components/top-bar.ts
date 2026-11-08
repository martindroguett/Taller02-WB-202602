import { Location } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { IconButton } from './icon-button';

@Component({
  selector: 'vt-top-bar',
  imports: [IconButton, MatToolbarModule],
  host: { '[class.small]': 'small()' },
  template: `
    <mat-toolbar>
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
    </mat-toolbar>
  `,
  styles: `
    :host {
      display: block;
    }
    mat-toolbar {
      --mat-toolbar-container-background-color: transparent;
      --mat-toolbar-container-text-color: var(--ink);
      --mat-toolbar-standard-height: 52px;
      --mat-toolbar-mobile-height: 52px;
      justify-content: space-between;
      gap: var(--space-3);
      min-height: 52px;
      padding: 0;
    }
    /* mat-toolbar fija la tipografía de los títulos; aquí se conserva la de Vitrina. */
    mat-toolbar h1 {
      min-width: 0;
      font: var(--text-display-lg);
      letter-spacing: -0.02em;
    }
    mat-toolbar h1.chico {
      font: var(--text-body-strong);
      letter-spacing: 0;
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
