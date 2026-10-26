import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../services/catalogo.service';
import { relativo } from '../models/format';
import { Pieza } from '../models/vitrina';
import { Avatar } from './avatar';

@Component({
  selector: 'vt-activity-row',
  imports: [Avatar, RouterLink],
  template: `
    <a [routerLink]="['/pieza', pieza().id]">
      <vt-avatar [nombre]="usuario().username" [tam]="44" />
      <span class="txt">
        <span class="body-strong">{{ usuario().username }}</span>
        <span class="body"> agregó {{ pieza().nombre }}</span>
        <span class="caption vt-muted">{{ cuando() }}</span>
      </span>
    </a>
  `,
  styles: `
    a {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      min-height: var(--tap-target);
    }
    .txt {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .body,
    .body-strong {
      font-size: 14px;
      line-height: 20px;
    }
  `,
})
export class ActivityRow {
  private readonly catalogo = inject(CatalogoService);
  readonly pieza = input.required<Pieza>();
  protected readonly usuario = computed(() => this.catalogo.usuario(this.pieza().duenoId));
  protected readonly cuando = computed(() => relativo(this.pieza().hace));
}
