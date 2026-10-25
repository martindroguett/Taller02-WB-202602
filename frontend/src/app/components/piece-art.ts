import { Component, input } from '@angular/core';
import { CategoriaSlug } from '../models/vitrina';

@Component({
  selector: 'vt-piece-art',
  host: { '[class]': '"vt-c-" + categoria()', '[class.bare]': 'bare()', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet">
      @if (!bare()) {
        <rect class="fondo" width="120" height="120" />
      }
      @switch (categoria()) {
        @case ('cartas') {
          <g transform="rotate(-16 60 96)">
            <rect class="n" x="34" y="22" width="50" height="72" rx="8" />
            <rect class="c" x="39" y="27" width="40" height="62" rx="5" />
          </g>
          <g transform="rotate(14 60 96)">
            <rect class="o" x="38" y="20" width="50" height="72" rx="8" />
            <rect class="s" x="43" y="25" width="40" height="62" rx="5" />
            <circle class="o" cx="63" cy="56" r="11" />
          </g>
          <g transform="rotate(-2 60 96)">
            <rect class="o" x="35" y="16" width="50" height="72" rx="8" />
            <rect class="c" x="40" y="21" width="40" height="62" rx="5" />
            <path
              class="n"
              d="M60 38l6 12 13 2-9.500 9 2.500 13L60 67l-12 7 2.500-13L41 52l13-2z"
            />
          </g>
        }
        @case ('videojuegos') {
          <g transform="rotate(-6 60 60)">
            <path class="n" d="M32 24h56v62a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6z" />
            <rect class="n" x="40" y="14" width="40" height="14" rx="3" />
            <rect class="c" x="40" y="34" width="40" height="36" rx="5" />
            <rect class="o" x="46" y="42" width="28" height="4" rx="2" />
            <rect class="o" x="46" y="52" width="18" height="4" rx="2" />
            <circle class="s" cx="68" cy="60" r="4" />
            <rect class="o" x="42" y="80" width="36" height="6" rx="2" />
          </g>
        }
        @case ('juguetes') {
          <g transform="rotate(5 60 60)">
            <circle class="s" cx="60" cy="14" r="5" />
            <rect class="n" x="58" y="16" width="4" height="12" />
            <rect class="c" x="34" y="26" width="52" height="38" rx="12" />
            <circle class="n" cx="48" cy="44" r="7" />
            <circle class="o" cx="50" cy="42" r="2.500" />
            <circle class="n" cx="72" cy="44" r="7" />
            <circle class="o" cx="74" cy="42" r="2.500" />
            <rect class="n" x="42" y="68" width="36" height="30" rx="8" />
            <rect class="c" x="52" y="76" width="16" height="6" rx="3" />
            <rect class="c" x="22" y="70" width="14" height="8" rx="4" />
            <rect class="c" x="84" y="70" width="14" height="8" rx="4" />
            <rect class="n" x="46" y="98" width="10" height="12" rx="3" />
            <rect class="n" x="64" y="98" width="10" height="12" rx="3" />
          </g>
        }
        @case ('vinilos') {
          <g transform="rotate(-8 60 60)">
            <rect class="o" x="20" y="20" width="76" height="76" rx="8" />
            <rect class="c" x="26" y="26" width="64" height="64" rx="5" />
            <circle class="n" cx="70" cy="64" r="40" />
            <circle class="surco" cx="70" cy="64" r="32" />
            <circle class="surco" cx="70" cy="64" r="25" />
            <circle class="c" cx="70" cy="64" r="15" />
            <circle class="s" cx="70" cy="64" r="5" />
            <circle class="o" cx="70" cy="64" r="1.800" />
          </g>
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .fondo {
      fill: var(--c-soft);
    }
    .n {
      fill: var(--night);
    }
    .o {
      fill: var(--on-night);
    }
    .c {
      fill: var(--c);
    }
    .s {
      fill: var(--spark);
    }
    .surco {
      fill: none;
      stroke: var(--on-night-muted);
      stroke-opacity: 0.35;
      stroke-width: 1;
    }
  `,
})
export class PieceArt {
  readonly categoria = input.required<CategoriaSlug>();
  readonly bare = input(false);
}
