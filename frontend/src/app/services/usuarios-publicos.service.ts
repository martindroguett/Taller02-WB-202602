import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Pagina, PiezaPublica } from './catalogo-publico.service';

export interface UsuarioPublico {
  id: number;
  username: string;
  bio: string;
  seguidores: number;
  siguiendo: number;
  lo_sigo: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuariosPublicosService {
  private readonly http = inject(HttpClient);
  private url(username: string): string {
    return `${environment.apiUrl}/usuarios/${encodeURIComponent(username)}`;
  }
  perfil(username: () => string, sesion: () => unknown) {
    return httpResource<UsuarioPublico>(() => {
      sesion();
      const nombre = username();
      return nombre ? this.url(nombre) : undefined;
    });
  }
  piezas(username: () => string, desplazamiento: () => number, sesion: () => unknown) {
    return httpResource<Pagina<PiezaPublica>>(() => {
      sesion();
      const nombre = username();
      return nombre
        ? {
            url: `${this.url(nombre)}/piezas`,
            params: { limite: 20, desplazamiento: desplazamiento() },
          }
        : undefined;
    });
  }
  /** Las personas que sigue el usuario (la fila de avatares del Feed). */
  seguidos(username: () => string) {
    return httpResource<Pagina<Pick<UsuarioPublico, 'id' | 'username'>>>(() => {
      const nombre = username();
      return nombre ? { url: `${this.url(nombre)}/seguidos`, params: { limite: 20 } } : undefined;
    });
  }
  seguir(username: string, siguiendo: boolean) {
    const url = `${this.url(username)}/seguir`;
    return siguiendo
      ? this.http.delete<Pick<UsuarioPublico, 'lo_sigo' | 'seguidores'>>(url)
      : this.http.post<Pick<UsuarioPublico, 'lo_sigo' | 'seguidores'>>(url, {});
  }
}
