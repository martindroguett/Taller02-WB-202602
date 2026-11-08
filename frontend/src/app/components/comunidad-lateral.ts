import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { compacto } from '../models/format';
import { AuthService } from '../services/auth.service';
import { UsuariosPublicosService } from '../services/usuarios-publicos.service';
import { Avatar } from './avatar';
import { Button } from './button';

/** Columna lateral de escritorio: «Tu vitrina» y, debajo, novedades o sugerencias para seguir. */
@Component({
  selector: 'vt-comunidad-lateral',
  imports: [Avatar, Button, RouterLink],
  template: `
    @if (yo(); as usuario) {
      <a
        class="resumen panel"
        [routerLink]="['/coleccionistas', usuario.username]"
        aria-label="Ver tu perfil y colección"
      >
        <vt-avatar [nombre]="usuario.username" anillo="brand" [tam]="64" />
        <div>
          <h2 class="title">Tu vitrina</h2>
          <p class="caption vt-muted">&#64;{{ usuario.username }}</p>
        </div>
        @if (perfil.value(); as datos) {
          <dl class="cifras">
            <div>
              <dd class="stat">{{ piezas.value()?.total ?? '–' }}</dd>
              <dt>Piezas</dt>
            </div>
            <div>
              <dd class="stat">{{ compacto(datos.seguidores) }}</dd>
              <dt>Seguidores</dt>
            </div>
            <div>
              <dd class="stat">{{ compacto(datos.siguiendo) }}</dd>
              <dt>Siguiendo</dt>
            </div>
          </dl>
        }
      </a>
      <a vt-button variant="accent" icon="add" [block]="true" routerLink="/coleccion/nueva"
        >Agregar pieza</a
      >
    }
    <section class="panel lista">
      <h2 class="title">Descubre Vitrina</h2>
      <p class="caption vt-muted">Explora piezas y conoce a otros coleccionistas.</p>
      <a vt-button variant="secondary" routerLink="/">Explorar piezas</a>
    </section>
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
  private readonly auth = inject(AuthService);
  private readonly usuarios = inject(UsuariosPublicosService);
  protected readonly yo = this.auth.usuario;
  protected readonly perfil = this.usuarios.perfil(
    () => this.yo()?.username ?? '',
    this.auth.token,
  );
  protected readonly piezas = this.usuarios.piezas(
    () => this.yo()?.username ?? '',
    () => 0,
    this.auth.token,
  );
  protected readonly compacto = compacto;
  readonly modo = input<'novedades' | 'sugerencias'>('sugerencias');
}
