import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Pagina, PiezaPublica } from './catalogo-publico.service';
import { ToastService } from './toast.service';

/** Lo que cambia en una pieza al dar me gusta o guardarla. */
export type Interaccion = Pick<PiezaPublica, 'gustada' | 'megusta' | 'guardada' | 'guardados'>;

export interface EstadoMeGusta {
  gustada: boolean;
  megusta: number;
}

export interface EstadoGuardado {
  guardada: boolean;
  guardados: number;
}

const LIMITE = 20;

@Injectable({ providedIn: 'root' })
export class InteraccionesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // Cambios hechos en esta sesión, por id de pieza. Las listas que ya se cargaron (Explorar, el detalle,
  // el Feed) traen los datos de cuando se pidieron; este mapa las mantiene al día sin volver a pedirlas.
  private readonly cambios = signal<ReadonlyMap<number, Partial<Interaccion>>>(new Map());
  // Piezas con una solicitud en curso: un segundo clic se ignora hasta que la API responda.
  private readonly enCurso = signal<ReadonlySet<number>>(new Set());

  constructor() {
    // Los me gusta y guardados son de cada usuario: al cerrar sesión o cambiar de cuenta se olvidan.
    effect(() => {
      this.auth.usuario()?.id;
      untracked(() => this.cambios.set(new Map()));
    });
  }

  /** El estado actual de una pieza: el cambio reciente si existe, si no lo que trajo la API. */
  estado(pieza: PiezaPublica): Interaccion {
    const cambio = this.cambios().get(pieza.id);
    return {
      gustada: cambio?.gustada ?? pieza.gustada,
      megusta: cambio?.megusta ?? pieza.megusta,
      guardada: cambio?.guardada ?? pieza.guardada,
      guardados: cambio?.guardados ?? pieza.guardados,
    };
  }

  ocupada(id: number): boolean {
    return this.enCurso().has(id);
  }

  alternarMeGusta(pieza: PiezaPublica): void {
    const antes = this.estado(pieza);
    const gustada = !antes.gustada;
    const url = `${environment.apiUrl}/piezas/${pieza.id}/megusta`;
    this.enviar(
      pieza.id,
      { gustada, megusta: antes.megusta + (gustada ? 1 : -1) },
      { gustada: antes.gustada, megusta: antes.megusta },
      gustada ? this.http.post<EstadoMeGusta>(url, {}) : this.http.delete<EstadoMeGusta>(url),
      'No se pudo registrar tu me gusta. Inténtalo de nuevo.',
    );
  }

  alternarGuardado(pieza: PiezaPublica): void {
    const antes = this.estado(pieza);
    const guardada = !antes.guardada;
    const url = `${environment.apiUrl}/piezas/${pieza.id}/guardar`;
    const enviado = this.enviar(
      pieza.id,
      { guardada, guardados: antes.guardados + (guardada ? 1 : -1) },
      { guardada: antes.guardada, guardados: antes.guardados },
      guardada ? this.http.post<EstadoGuardado>(url, {}) : this.http.delete<EstadoGuardado>(url),
      'No se pudo actualizar tus favoritos. Inténtalo de nuevo.',
    );
    if (enviado) {
      this.toast.show(guardada ? 'Guardada en favoritos' : 'Quitada de favoritos', 'success', {
        texto: 'Deshacer',
        fn: () => this.alternarGuardado(pieza),
      });
    }
  }

  /** Las piezas que sigue el usuario, la más nueva primero. Se recarga al cambiar de sesión o de página. */
  feed(desplazamiento: () => number) {
    return this.pagina('feed', desplazamiento);
  }

  /** Las piezas guardadas, la guardada más recientemente primero. */
  favoritos(desplazamiento: () => number) {
    return this.pagina('favoritos', desplazamiento);
  }

  private pagina(ruta: 'feed' | 'favoritos', desplazamiento: () => number) {
    return httpResource<Pagina<PiezaPublica>>(() =>
      // Leer el id hace que la lista se vuelva a pedir si cambia el usuario; sin sesión no se pide.
      this.auth.usuario()?.id
        ? {
            url: `${environment.apiUrl}/${ruta}`,
            params: { limite: LIMITE, desplazamiento: desplazamiento() },
          }
        : undefined,
    );
  }

  /**
   * Cambia la pieza apenas se presiona el botón (actualización optimista), envía la solicitud
   * y deja el valor que responde la API. Si falla, vuelve al estado anterior.
   * Devuelve false si no se envió: sin sesión o con otra solicitud de esa pieza en curso.
   */
  private enviar<T extends Partial<Interaccion>>(
    id: number,
    optimista: T,
    anterior: T,
    solicitud: Observable<T>,
    mensajeError: string,
  ): boolean {
    if (!this.exigirSesion() || this.ocupada(id)) return false;

    this.anotar(id, optimista);
    this.enCurso.update((s) => new Set(s).add(id));
    solicitud.subscribe({
      next: (respuesta) => this.anotar(id, respuesta),
      error: (error) => {
        this.anotar(id, anterior);
        // El 401 ya lo maneja el interceptor: cierra la sesión y lleva a ingresar.
        if (error.status !== 401) this.toast.show(mensajeError, 'danger');
        this.terminar(id);
      },
      complete: () => this.terminar(id),
    });
    return true;
  }

  private exigirSesion(): boolean {
    if (this.auth.autenticado()) return true;
    this.toast.show('Ingresa para dar me gusta y guardar piezas');
    this.router.navigate(['/ingresar'], { queryParams: { returnUrl: this.router.url } });
    return false;
  }

  private anotar(id: number, cambio: Partial<Interaccion>): void {
    this.cambios.update((mapa) => new Map(mapa).set(id, { ...mapa.get(id), ...cambio }));
  }

  private terminar(id: number): void {
    this.enCurso.update((s) => {
      const copia = new Set(s);
      copia.delete(id);
      return copia;
    });
  }
}
