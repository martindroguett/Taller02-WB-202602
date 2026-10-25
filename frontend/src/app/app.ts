import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { TabBar } from './components/tab-bar';
import { ToastHost } from './components/toast-host';

const SIN_NAV = ['/ingresar', '/pieza', '/coleccion'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TabBar, ToastHost],
  template: `
    <div class="shell" [class.con-nav]="conNav()">
      <router-outlet />
    </div>
    @if (conNav()) {
      <vt-tab-bar />
    }
    <vt-toast-host />
  `,
  styles: `
    .shell {
      min-height: 100dvh;
      overflow-x: clip;
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
  protected readonly conNav = computed(() => !SIN_NAV.some((r) => this.url().startsWith(r)));
}
