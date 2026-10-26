import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { Icon } from './icon';

@Component({
  selector: 'vt-toast-host',
  imports: [Icon],
  template: `
    <div class="zona" role="status" aria-live="polite">
      @if (toast.actual(); as t) {
        <div class="toast" [attr.data-tono]="t.tono">
          <vt-icon
            [name]="t.tono === 'danger' ? 'error' : t.tono === 'success' ? 'check_circle' : 'info'"
            [filled]="true"
            [size]="22"
          />
          <span class="texto">{{ t.texto }}</span>
          @if (t.accion; as a) {
            <button type="button" (click)="a.fn(); toast.cerrar()">{{ a.texto }}</button>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .zona {
      position: fixed;
      z-index: 40;
      left: 0;
      right: 0;
      bottom: 96px;
      display: flex;
      justify-content: center;
      padding: 0 var(--space-4);
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      min-height: 48px;
      max-width: 420px;
      padding: 0 var(--space-2) 0 var(--space-4);
      border-radius: var(--radius-pill);
      background: var(--night);
      color: var(--on-night);
      font: var(--text-label);
      box-shadow: var(--shadow-float);
      animation: sube 240ms ease;
    }
    .toast[data-tono='danger'] {
      background: var(--danger);
      color: var(--on-danger);
    }
    .toast[data-tono='success'] vt-icon {
      color: var(--vinilos);
    }
    .texto {
      padding: var(--space-2) 0;
    }
    button {
      min-height: var(--tap-target);
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-pill);
      background: transparent;
      color: inherit;
      font: var(--text-label);
      text-decoration: underline;
      cursor: pointer;
    }
    @keyframes sube {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
    }
    @media (min-width: 600px) {
      .zona {
        bottom: var(--space-6);
      }
    }
  `,
})
export class ToastHost {
  protected readonly toast = inject(ToastService);
}
