import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Pagina } from './catalogo-publico.service';
import { ToastService } from './toast.service';

export interface Comentario {
  id: number;
  texto: string;
  autor: { id: number; username: string };
  creado_en: string;
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

  enviar(texto: string, autor: Comentario['autor']): void {
    const local: ComentarioLocal = {
      id: --this.temporal,
      texto: texto.trim(),
      autor,
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
    const antes = this.items();
    this.items.set(antes.filter((c) => c.id !== comentario.id));
    this.total.update((n) => n - 1);
    this.http.delete<void>(`${environment.apiUrl}/comentarios/${comentario.id}`).subscribe({
      error: () => {
        this.items.set(antes);
        this.total.update((n) => n + 1);
        this.toast.show('No pudimos eliminar el comentario. Inténtalo de nuevo.', 'danger');
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
      .post<Comentario>(`${environment.apiUrl}/piezas/${pieza}/comentarios`, { texto: local.texto })
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
