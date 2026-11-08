import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TabBar } from './components/tab-bar';

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
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly conNav = computed(() => {
    const path = this.url().split(/[?#]/, 1)[0];
    return !SIN_NAV.some((r) => path === r || path.startsWith(`${r}/`));
  });
  protected readonly soloEscritorio = computed(() => {
    const path = this.url().split(/[?#]/, 1)[0];
    return NAV_SOLO_ESCRITORIO.some((r) => path === r || path.startsWith(`${r}/`));
  });
}
