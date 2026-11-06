import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CategoriaSlug, DatosPieza } from '../models/vitrina';
import { environment } from '../../environments/environment';

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
    return this.http.get<Pagina<PiezaPublica>>(`${environment.apiUrl}/piezas`, { params });
  }

  crear(datos: DatosPieza) {
    return this.http.post<PiezaPublica>(`${environment.apiUrl}/piezas`, datos);
  }

  actualizar(id: number, datos: DatosPieza) {
    return this.http.put<PiezaPublica>(`${environment.apiUrl}/piezas/${id}`, datos);
  }

  eliminar(id: number) {
    return this.http.delete<void>(`${environment.apiUrl}/piezas/${id}`);
  }

  obtener(id: number) {
    return this.http.get<PiezaPublica>(`${environment.apiUrl}/piezas/${id}`);
  }
}
