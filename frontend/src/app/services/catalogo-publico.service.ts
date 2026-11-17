import { HttpClient, httpResource, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CategoriaSlug, DatosPieza } from '../models/vitrina';
import { environment } from '../../environments/environment';

export interface PiezaPublica {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: CategoriaSlug;
  imagen_url: string;
  codigo: string | null;
  latitud: number | null;
  longitud: number | null;
  /** Ciudad o comuna donde se consiguió. */
  lugar?: string | null;
  /** Solo en búsquedas por cercanía: kilómetros desde la ubicación enviada. */
  distancia_km?: number | null;
  dueno: { id: number; username: string };
  megusta: number;
  guardados: number;
  gustada: boolean;
  guardada: boolean;
  creado_en: string;
  actualizado_en: string;
}

/** Filtros que agrega la app móvil a la búsqueda de Explorar. */
export interface FiltrosMovil {
  /** Código escaneado: piezas con ese mismo código de barras. */
  codigo?: string;
  /** Ubicación actual: piezas conseguidas cerca, de la más cercana a la más lejana. */
  cerca?: { latitud: number; longitud: number; radioKm?: number };
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

  listar(q: string, categoria: string, desplazamiento = 0, filtros: FiltrosMovil = {}) {
    let params = new HttpParams()
      .set('orden', filtros.cerca ? 'cercanas' : 'recientes')
      .set('limite', 20)
      .set('desplazamiento', desplazamiento);
    if (q.trim()) params = params.set('q', q.trim());
    if (categoria !== 'todas') params = params.set('categoria', categoria);
    if (filtros.codigo) params = params.set('codigo', filtros.codigo);
    if (filtros.cerca) {
      params = params
        .set('lat', filtros.cerca.latitud)
        .set('lng', filtros.cerca.longitud)
        .set('radio_km', filtros.cerca.radioKm ?? 50);
    }
    return this.http.get<Pagina<PiezaPublica>>(`${environment.apiUrl}/piezas`, { params });
  }

  destacadas() {
    return httpResource<Pagina<PiezaPublica>>(() => ({
      url: `${environment.apiUrl}/piezas`,
      params: { orden: 'populares', limite: 6 },
    }));
  }

  /** Una pieza al azar: la app la muestra al agitar el celular. */
  aleatoria(excluir?: number) {
    const params = excluir ? new HttpParams().set('excluir', excluir) : undefined;
    return this.http.get<PiezaPublica>(`${environment.apiUrl}/piezas/aleatoria`, { params });
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

  detalle(id: () => string | undefined) {
    return httpResource<PiezaPublica>(() => {
      const valor = id();
      return valor && /^[1-9]\d*$/.test(valor) && Number.isSafeInteger(Number(valor))
        ? `${environment.apiUrl}/piezas/${valor}`
        : undefined;
    });
  }
}
