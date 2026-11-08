import { BreakpointObserver } from '@angular/cdk/layout';
import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

const ESCRITORIO = '(min-width: 1000px)';

/** Tamaño de pantalla: desde 1000 px el detalle de la pieza se muestra en dos columnas o en una ventana. */
@Injectable({ providedIn: 'root' })
export class Pantalla {
  private readonly observador = inject(BreakpointObserver);
  readonly escritorio = toSignal(this.observador.observe(ESCRITORIO).pipe(map((r) => r.matches)), {
    initialValue: this.observador.isMatched(ESCRITORIO),
  });
}
