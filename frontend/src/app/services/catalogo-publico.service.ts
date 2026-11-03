import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CategoriaSlug } from '../models/vitrina';

export interface PiezaPublica {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: CategoriaSlug;
  imagen_url: string;
  dueno: { id: number; username: string };
  megusta: number;
  guardados: number;
  gustada: boolean;
  guardada: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  limite: number;
  desplazamiento: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogoPublicoService {
  private readonly http = inject(HttpClient);

  listar(q: string, categoria: string, desplazamiento = 0) {
    let params = new HttpParams()
      .set('orden', 'recientes')
      .set('limite', 20)
      .set('desplazamiento', desplazamiento);
    if (q.trim()) params = params.set('q', q.trim());
    if (categoria !== 'todas') params = params.set('categoria', categoria);
    return this.http.get<Pagina<PiezaPublica>>('/api/piezas', { params });
  }

  obtener(id: number) {
    return this.http.get<PiezaPublica>(`/api/piezas/${id}`);
  }
}
