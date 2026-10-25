import { Component, output } from '@angular/core';
import { Button } from './button';
import { PieceArt } from './piece-art';
import { Icon } from './icon';

@Component({
  selector: 'vt-promo-banner',
  imports: [Button, PieceArt, Icon],
  template: `
    <section class="banner vt-showcase">
      <div class="texto">
        <span class="etiqueta catalog">VNL · Selección semanal</span>
        <h2>Historias que giran a 33⅓.</h2>
        <p>Primeras prensas, vinilos en color y nuevos hallazgos de la comunidad.</p>
        <button type="button" vt-button size="sm" (click)="accion.emit()">
          Explorar vinilos <vt-icon name="arrow_forward" [size]="20" />
        </button>
      </div>
      <div class="visual" aria-hidden="true">
        <img src="/fotos/vinilo-turquesa.jpg" alt="" />
        <vt-piece-art categoria="vinilos" [bare]="true" />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .banner {
      --showcase: var(--vinilos);
      display: grid;
      grid-template-columns: minmax(0, 1fr) 30%;
      align-items: center;
      gap: var(--space-5);
      padding: 20px 24px;
      border-radius: var(--radius-xl);
      color: var(--ink);
      overflow: hidden;
    }
    .texto {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-2);
    }
    h2 {
      font: var(--text-display-lg);
      font-size: clamp(24px, 2.2vw, 30px);
      line-height: 1.2;
      max-width: 22ch;
      color: var(--on-night);
    }
    .etiqueta {
      font-size: 10px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      padding: 6px 10px;
      background: var(--glass);
      border-radius: var(--radius-pill);
    }
    p {
      font-size: 14px;
      line-height: 20px;
    }
    .visual {
      position: relative;
      height: 144px;
    }
    img {
      width: 92%;
      height: 100%;
      margin-left: auto;
      object-fit: cover;
      border: 4px solid var(--surface);
      border-radius: var(--radius-lg);
      transform: rotate(8deg);
      box-shadow: var(--shadow-pop);
    }
    vt-piece-art {
      position: absolute;
      left: -16px;
      bottom: -16px;
      width: 72%;
      max-width: 132px;
      transform: rotate(-12deg);
    }
    @media (max-width: 380px) {
      .banner {
        gap: var(--space-2);
        padding: var(--space-4);
      }
      .texto {
        gap: var(--space-2);
      }
      p {
        font-size: 13px;
        line-height: 18px;
      }
    }
  `,
})
export class PromoBanner {
  readonly accion = output<void>();
}
