import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from './icon';
import { Logo } from './logo';

@Component({
  selector: 'vt-tab-bar',
  imports: [RouterLink, RouterLinkActive, Icon, Logo],
  template: `
    <nav aria-label="Principal">
      <a class="logo" routerLink="/" aria-label="Vitrina, ir a Explorar"
        ><vt-logo [soloMarca]="true" tono="invert" [tam]="40"
      /></a>
      @for (it of items; track it.ruta; let i = $index) {
        @if (i === 2) {
          <a class="agregar" routerLink="/coleccion/nueva" aria-label="Agregar pieza"
            ><vt-icon name="add" [size]="28"
          /></a>
        }
        <a
          class="item"
          [routerLink]="it.ruta"
          routerLinkActive="activo"
          [routerLinkActiveOptions]="{ exact: !!it.exacto }"
          #rla="routerLinkActive"
          [attr.aria-label]="it.nombre"
          [attr.aria-current]="rla.isActive ? 'page' : null"
        >
          <vt-icon [name]="it.icono" [filled]="rla.isActive" [size]="24" />
          <span class="txt">{{ it.nombre }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    nav {
      position: fixed;
      z-index: 20;
      left: 50%;
      bottom: var(--space-3);
      transform: translateX(-50%);
      width: min(calc(100% - 2 * var(--space-4)), 420px);
      height: var(--tabbar-height);
      padding: 0 var(--space-2);
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: var(--night);
      border-radius: var(--radius-pill);
      box-shadow: var(--shadow-float);
    }
    .logo {
      display: none;
    }
    .item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      min-width: var(--tap-target);
      height: var(--tap-target);
      border-radius: var(--radius-pill);
      color: var(--on-night-muted);
      font: var(--text-label);
      transition:
        transform 120ms ease,
        background-color 160ms ease;
    }
    .item:active {
      transform: scale(0.96);
    }
    .txt {
      display: none;
    }
    .item.activo {
      background: var(--on-night);
      color: var(--night);
      padding: 0 var(--space-3);
    }
    .item.activo .txt {
      display: inline;
    }
    .agregar {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      margin-top: -24px;
      border-radius: 34%;
      background: var(--brand);
      color: var(--on-brand);
      box-shadow: var(--shadow-brand);
      transform: rotate(-8deg);
      transition: transform 120ms ease;
    }
    .agregar:active {
      transform: rotate(-8deg) scale(0.96);
    }
    .agregar:focus-visible,
    .item:focus-visible {
      outline-color: var(--on-night);
    }

    @media (min-width: 600px) {
      nav {
        left: var(--space-4);
        top: 50%;
        bottom: auto;
        transform: translateY(-50%);
        width: 72px;
        height: max-content;
        max-height: calc(100dvh - 2 * var(--space-4));
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: var(--space-4) 0;
        flex-direction: column;
        justify-content: flex-start;
        gap: var(--space-2);
        border-radius: var(--radius-xl);
      }
      nav > * {
        flex-shrink: 0;
      }
      .logo {
        display: block;
        margin-bottom: var(--space-4);
      }
      .item {
        width: 48px;
        height: 48px;
      }
      .item.activo {
        padding: 0;
      }
      .item.activo .txt {
        display: none;
      }
      .agregar {
        margin: var(--space-2) 0;
      }
    }
  `,
})
export class TabBar {
  protected readonly items = [
    { ruta: '/', icono: 'explore', nombre: 'Explorar', exacto: true },
    { ruta: '/feed', icono: 'dynamic_feed', nombre: 'Feed', exacto: false },
    { ruta: '/favoritos', icono: 'bookmark', nombre: 'Favoritos', exacto: false },
    { ruta: '/perfil', icono: 'person', nombre: 'Perfil', exacto: false },
  ];
}
