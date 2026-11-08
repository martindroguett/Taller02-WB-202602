import { Component, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Icon } from './icon';
import { Logo } from './logo';

@Component({
  selector: 'vt-tab-bar',
  imports: [RouterLink, RouterLinkActive, Icon, Logo, MatTooltip],
  template: `
    <nav aria-label="Principal">
      <a
        class="logo"
        routerLink="/"
        aria-label="Vitrina, ir a Explorar"
        matTooltip="Explorar"
        matTooltipPosition="right"
        matTooltipTouchGestures="off"
        ><vt-logo [soloMarca]="true" [tam]="40"
      /></a>
      @for (it of items; track it.ruta; let i = $index) {
        @if (i === 2) {
          <a
            class="agregar"
            routerLink="/coleccion/nueva"
            aria-label="Agregar pieza"
            matTooltip="Agregar pieza"
            matTooltipPosition="right"
            matTooltipTouchGestures="off"
            ><vt-icon name="add" [size]="28"
          /></a>
        }
        <a
          class="item"
          [routerLink]="it.ruta"
          routerLinkActive="activo"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{
            paths: it.exacto ? 'exact' : 'subset',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored'
          }"
          #rla="routerLinkActive"
          [attr.aria-label]="it.nombre"
          [matTooltip]="it.nombre"
          matTooltipPosition="right"
          matTooltipTouchGestures="off"
        >
          <vt-icon [name]="it.icono" [filled]="rla.isActive" [size]="24" />
          <span class="txt">{{ it.nombre }}</span>
        </a>
      }
      @if (auth.autenticado()) {
        <button
          type="button"
          class="item sesion"
          aria-label="Cerrar sesión"
          matTooltip="Cerrar sesión"
          matTooltipPosition="right"
          matTooltipTouchGestures="off"
          (click)="cerrarSesion()"
        >
          <vt-icon name="logout" [size]="24" />
        </button>
      } @else {
        <a
          class="item sesion"
          routerLink="/ingresar"
          aria-label="Ingresar"
          matTooltip="Ingresar"
          matTooltipPosition="right"
          matTooltipTouchGestures="off"
        >
          <vt-icon name="login" [size]="24" />
        </a>
      }
    </nav>
  `,
  styles: `
    nav {
      position: fixed;
      z-index: 20;
      left: 50%;
      bottom: calc(var(--space-3) + env(safe-area-inset-bottom));
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
    button.item {
      border: 0;
      background: transparent;
      padding: 0;
      cursor: pointer;
    }
    /* Cerrar sesión vive solo en el riel; en el teléfono sigue en el perfil. */
    .sesion {
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
      margin-top: 0;
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
    @media (max-width: 360px) {
      .item.activo .txt {
        display: none;
      }
      .item.activo {
        padding: 0;
      }
      .agregar {
        width: 48px;
        height: 48px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .item:active {
        transform: none;
      }
      .agregar:active {
        transform: rotate(-8deg);
      }
    }
    @media (min-width: 600px) {
      nav {
        left: var(--space-4);
        top: var(--space-4);
        bottom: var(--space-4);
        transform: none;
        width: 72px;
        height: auto;
        max-height: calc(100dvh - 2 * var(--space-4));
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: var(--space-4) 0;
        flex-direction: column;
        justify-content: flex-start;
        gap: var(--space-2);
        border-radius: var(--radius-xl);
        background: var(--surface);
        box-shadow: var(--shadow-card);
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
        color: var(--ink-muted);
      }
      .item.activo {
        padding: 0;
        background: var(--night);
        color: var(--on-night);
      }
      .item:focus-visible,
      .agregar:focus-visible {
        outline-color: var(--focus);
      }
      .item.activo .txt {
        display: none;
      }
      .agregar {
        order: 1;
        margin: auto 0 0;
        width: 48px;
        height: 48px;
      }
      .sesion {
        display: inline-flex;
        order: 2;
      }
    }
  `,
})
export class TabBar {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
    this.toast.show('Cerraste sesión.');
    void this.router.navigateByUrl('/');
  }

  protected readonly items = [
    { ruta: '/', icono: 'explore', nombre: 'Explorar', exacto: true },
    { ruta: '/feed', icono: 'dynamic_feed', nombre: 'Feed', exacto: false },
    { ruta: '/favoritos', icono: 'bookmark', nombre: 'Favoritos', exacto: false },
    { ruta: '/perfil', icono: 'person', nombre: 'Perfil', exacto: false },
  ];
}
