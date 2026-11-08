import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Pagina } from './catalogo-publico.service';
import { ToastService } from './toast.service';

export interface Comentario {
  id: number;
  texto: string;
  autor: { id: number; username: string };
  padre_id: number | null;
  megusta: number;
  gustado: boolean;
  creado_en: string;
}

export interface Hilo {
  raiz: ComentarioLocal;
  respuestas: ComentarioLocal[];
}

/** Un comentario que todavía no confirma el servidor, o cuyo envío falló. */
export interface ComentarioLocal extends Comentario {
  estado?: 'enviando' | 'error';
}

export const MAX_COMENTARIO = 300;
const POR_PAGINA = 50;

/** Comentarios de la pieza abierta. Guarda un solo hilo a la vez: el del detalle que se está viendo. */
@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly items = signal<ComentarioLocal[]>([]);
  readonly total = signal(0);
  readonly cargando = signal(false);
  readonly error = signal(false);
  /** Comentarios agrupados: cada uno con sus respuestas, de un solo nivel. */
  readonly hilos = computed<Hilo[]>(() => {
    const lista = this.items();
    const ids = new Set(lista.map((c) => c.id));
    const raices = lista.filter((c) => c.padre_id === null || !ids.has(c.padre_id));
    return raices.map((raiz) => ({
      raiz,
      respuestas: lista.filter((c) => c.padre_id === raiz.id),
    }));
  });

  private piezaId = 0;
  private temporal = 0;

  cargar(piezaId: number): void {
    this.piezaId = piezaId;
    this.items.set([]);
    this.total.set(0);
    this.pedirPagina(0);
  }

  cargarMas(): void {
    if (!this.cargando()) this.pedirPagina(this.items().filter((c) => !c.estado).length);
  }

  get piezaActual(): number {
    return this.piezaId;
  }

  get quedanPorCargar(): boolean {
    return this.items().filter((c) => !c.estado).length < this.total();
  }

  enviar(texto: string, autor: Comentario['autor'], respondeA?: number): void {
    // Las respuestas son de un solo nivel: responder a una respuesta cuelga del comentario original.
    const destino = this.items().find((c) => c.id === respondeA);
    const local: ComentarioLocal = {
      id: --this.temporal,
      texto: texto.trim(),
      autor,
      padre_id: destino ? (destino.padre_id ?? destino.id) : null,
      megusta: 0,
      gustado: false,
      creado_en: new Date().toISOString(),
      estado: 'enviando',
    };
    this.items.update((lista) => [...lista, local]);
    this.publicar(local);
  }

  reintentar(local: ComentarioLocal): void {
    this.reemplazar(local.id, { ...local, estado: 'enviando' });
    this.publicar(local);
  }

  eliminar(comentario: ComentarioLocal): void {
    if (comentario.estado) {
      this.items.update((lista) => lista.filter((c) => c.id !== comentario.id));
      return;
    }
    // Al borrar un comentario se borran también sus respuestas.
    const antes = this.items();
    const antesTotal = this.total();
    const quitados = antes.filter((c) => c.id === comentario.id || c.padre_id === comentario.id);
    this.items.set(antes.filter((c) => !quitados.includes(c)));
    this.total.update((n) => n - quitados.filter((c) => !c.estado).length);
    this.http.delete<void>(`${environment.apiUrl}/comentarios/${comentario.id}`).subscribe({
      error: () => {
        this.items.set(antes);
        this.total.set(antesTotal);
        this.toast.show('No pudimos eliminar el comentario. Inténtalo de nuevo.', 'danger');
      },
    });
  }

  alternarMeGusta(comentario: ComentarioLocal): void {
    if (comentario.estado) return;
    const ruta = `${environment.apiUrl}/comentarios/${comentario.id}/megusta`;
    const quitar = comentario.gustado;
    this.reemplazar(comentario.id, {
      ...comentario,
      gustado: !quitar,
      megusta: comentario.megusta + (quitar ? -1 : 1),
    });
    const peticion = quitar
      ? this.http.delete<{ gustado: boolean; megusta: number }>(ruta)
      : this.http.post<{ gustado: boolean; megusta: number }>(ruta, null);
    peticion.subscribe({
      next: (estado) => {
        const actual = this.items().find((c) => c.id === comentario.id);
        if (actual) this.reemplazar(comentario.id, { ...actual, ...estado });
      },
      error: () => {
        this.reemplazar(comentario.id, comentario);
        this.toast.show('No pudimos guardar tu me gusta. Inténtalo de nuevo.', 'danger');
      },
    });
  }

  private pedirPagina(desplazamiento: number): void {
    const pieza = this.piezaId;
    this.cargando.set(true);
    this.error.set(false);
    const params = new HttpParams().set('limite', POR_PAGINA).set('desplazamiento', desplazamiento);
    this.http
      .get<Pagina<Comentario>>(`${environment.apiUrl}/piezas/${pieza}/comentarios`, { params })
      .subscribe({
        next: (pagina) => {
          if (pieza !== this.piezaId) return;
          this.items.update((lista) => [...lista, ...pagina.items]);
          this.total.set(pagina.total);
          this.cargando.set(false);
        },
        error: () => {
          if (pieza !== this.piezaId) return;
          this.cargando.set(false);
          this.error.set(true);
        },
      });
  }

  private publicar(local: ComentarioLocal): void {
    const pieza = this.piezaId;
    this.http
      .post<Comentario>(`${environment.apiUrl}/piezas/${pieza}/comentarios`, {
        texto: local.texto,
        padre_id: local.padre_id,
      })
      .subscribe({
        next: (creado) => {
          if (pieza !== this.piezaId) return;
          this.reemplazar(local.id, creado);
          this.total.update((n) => n + 1);
        },
        error: () => {
          if (pieza === this.piezaId) this.reemplazar(local.id, { ...local, estado: 'error' });
        },
      });
  }

  private reemplazar(id: number, nuevo: ComentarioLocal): void {
    this.items.update((lista) => lista.map((c) => (c.id === id ? nuevo : c)));
  }
}
