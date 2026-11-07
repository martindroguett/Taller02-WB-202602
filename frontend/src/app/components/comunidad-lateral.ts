import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { compacto } from '../models/format';
import { CatalogoService } from '../services/catalogo.service';
import { ActivityRow } from './activity-row';
import { Avatar } from './avatar';
import { Button } from './button';
import { FollowButton } from './follow-button';

/** Columna lateral de escritorio: «Tu vitrina» y, debajo, novedades o sugerencias para seguir. */
@Component({
  selector: 'vt-comunidad-lateral',
  imports: [ActivityRow, Avatar, Button, FollowButton, RouterLink],
  template: `
    <a class="resumen panel" routerLink="/perfil" aria-label="Ver tu perfil y colección">
      <vt-avatar [nombre]="catalogo.yo.username" anillo="brand" [tam]="64" />
      <div>
        <h2 class="title">Tu vitrina</h2>
        <p class="caption vt-muted">&#64;{{ catalogo.yo.username }}</p>
      </div>
      <dl class="cifras">
        <div>
          <dd class="stat">{{ catalogo.piezasDe(catalogo.yo.id).length }}</dd>
          <dt>Piezas</dt>
        </div>
        <div>
          <dd class="stat">{{ compacto(catalogo.seguidores(catalogo.yo)) }}</dd>
          <dt>Seguidores</dt>
        </div>
        <div>
          <dd class="stat">{{ catalogo.seguidos().length }}</dd>
          <dt>Siguiendo</dt>
        </div>
      </dl>
    </a>
    <a vt-button variant="accent" icon="add" [block]="true" routerLink="/coleccion/nueva"
      >Agregar pieza</a
    >
    @if (modo() === 'novedades') {
      <section class="panel lista" aria-labelledby="novedades-titulo">
        <h2 class="title" id="novedades-titulo">Novedades</h2>
        @for (p of novedades(); track p.id) {
          <vt-activity-row [pieza]="p" />
        }
      </section>
    } @else {
      <section class="panel lista" aria-labelledby="sugerencias-titulo">
        <h2 class="title" id="sugerencias-titulo">Sugerencias</h2>
        <p class="caption vt-muted">Coleccionan lo mismo que tú.</p>
        @for (u of comunidad; track u.id) {
          <div class="recomendacion">
            <a class="persona" [routerLink]="['/perfil', u.username]">
              <vt-avatar [nombre]="u.username" [tam]="40" />
              <span class="persona-info"
                ><strong>&#64;{{ u.username }}</strong
                ><span class="caption vt-muted"
                  >{{ catalogo.piezasDe(u.id).length }}
                  {{ catalogo.piezasDe(u.id).length === 1 ? 'pieza' : 'piezas' }}</span
                ></span
              >
            </a>
            <vt-follow-button [usuarioId]="u.id" size="sm" />
          </div>
        }
      </section>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .panel {
      background: var(--surface);
      border-radius: 28px;
      padding: var(--space-6);
      box-shadow: var(--shadow-card);
    }
    .resumen {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      text-align: center;
    }
    .resumen vt-avatar {
      margin-top: 4px;
    }
    .cifras {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      width: 100%;
      margin: 0;
      padding: var(--space-4) 4px;
      background: var(--surface-sunken);
      border-radius: 20px;
    }
    .cifras div + div {
      border-left: 1px solid var(--line);
    }
    dd {
      margin: 0;
      font-size: 18px;
    }
    dt {
      font: var(--text-caption);
      color: var(--ink-muted);
      margin-top: 4px;
    }
    .lista {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .recomendacion {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--space-2);
    }
    .persona {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .persona-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .persona-info strong {
      font: var(--text-label);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class ComunidadLateral {
  protected readonly catalogo = inject(CatalogoService);
  protected readonly compacto = compacto;
  readonly modo = input<'novedades' | 'sugerencias'>('sugerencias');
  protected readonly comunidad = this.catalogo.usuarios.filter((u) => u.id !== this.catalogo.yo.id);
  protected readonly novedades = computed(() =>
    this.catalogo
      .recientes()
      .filter((p) => p.duenoId !== this.catalogo.yo.id)
      .slice(0, 3),
  );
}
