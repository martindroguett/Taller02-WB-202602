import { Location } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { App as CapApp } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TabBar } from './components/tab-bar';

interface BarraEstado {
  colorear(o: { color: string; iconosClaros: boolean }): Promise<void>;
}
const BarraEstado = registerPlugin<BarraEstado>('BarraEstado');

// Pantallas cuyo borde superior no es el fondo claro de la app (mismos colores que en tokens.css).
const BARRA_AZUL = ['/ingresar'];

const SIN_NAV = ['/ingresar'];
// En el teléfono estas pantallas tienen su propia barra de acciones; el riel solo aparece desde 600 px.
const NAV_SOLO_ESCRITORIO = ['/pieza', '/coleccion'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TabBar],
  template: `
    <div class="shell" [class.con-nav]="conNav()">
      <router-outlet />
    </div>
    @if (conNav()) {
      <vt-tab-bar [class.solo-escritorio]="soloEscritorio()" />
    }
  `,
  styles: `
    .shell {
      min-height: 100dvh;
      overflow-x: clip;
    }
    @media (max-width: 599px) {
      vt-tab-bar.solo-escritorio {
        display: none;
      }
    }
    /* Reserva 72 px para la navegación y 16 px de margen a cada lado. */
    @media (min-width: 600px) {
      .shell.con-nav {
        padding-left: 104px;
      }
    }
  `,
})
export class App {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  constructor() {
    // Botón/gesto «atrás» de Android: retrocede en la app y solo sale desde la pantalla de inicio.
    if (Capacitor.isNativePlatform()) {
      void CapApp.addListener('backButton', () => {
        if (window.history.state?.navigationId > 1) this.location.back();
        else if (this.router.url.split(/[?#]/, 1)[0] !== '/') void this.router.navigateByUrl('/');
        else void CapApp.exitApp();
      });
      effect(() => {
        const azul = this.barraAzul();
        void BarraEstado.colorear({ color: azul ? '#2b4cff' : '#f1f2f6', iconosClaros: azul });
      });
    }
  }
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  private readonly barraAzul = computed(() => {
    const path = this.url().split(/[?#]/, 1)[0];
    return BARRA_AZUL.some((r) => path === r || path.startsWith(`${r}/`));
  });
  protected readonly conNav = computed(() => {
    const path = this.url().split(/[?#]/, 1)[0];
    return !SIN_NAV.some((r) => path === r || path.startsWith(`${r}/`));
  });
  protected readonly soloEscritorio = computed(() => {
    const path = this.url().split(/[?#]/, 1)[0];
    return NAV_SOLO_ESCRITORIO.some((r) => path === r || path.startsWith(`${r}/`));
  });
}
