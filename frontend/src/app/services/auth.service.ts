import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';
import {
  UsuarioPrivadoApi,
  TokenRespuestaApi,
  DatosRegistroApi,
  DatosLoginApi,
} from '../models/auth';

const URL_AUTH = `${environment.apiUrl}/auth`;
const CLAVE_TOKEN = 'vitrina.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  // Esto puede cambiar la sesión
  private readonly tokenActual = signal<string | null>(localStorage.getItem(CLAVE_TOKEN));
  private readonly usuarioActual = signal<UsuarioPrivadoApi | null>(null);

  readonly token = this.tokenActual.asReadonly(); // El JWT para las solicitudes
  readonly usuario = this.usuarioActual.asReadonly(); // Usuario con sesión
  readonly autenticado = computed(() => this.usuarioActual() !== null); // Solo si el login confirma el token

  ingresar(datos: DatosLoginApi): Observable<TokenRespuestaApi> {
    return this.http
      .post<TokenRespuestaApi>(`${URL_AUTH}/login`, datos)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  registrar(datos: DatosRegistroApi): Observable<TokenRespuestaApi> {
    return this.http
      .post<TokenRespuestaApi>(`${URL_AUTH}/registro`, datos)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  recuperarSesion(): Observable<UsuarioPrivadoApi | null> {
    if (this.tokenActual() === null) {
      return of(null);
    }
    return this.http.get<UsuarioPrivadoApi>(`${URL_AUTH}/yo`).pipe(
      tap((usuario) => this.usuarioActual.set(usuario)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) this.cerrarSesion();
        else this.toast.show('No pudimos recuperar tu sesión. Revisa la conexión.', 'danger', {
          texto: 'Reintentar',
          fn: () => window.location.reload(),
        });
        return of(null);
      }),
    );
  }

  cerrarSesion(): void {
    this.tokenActual.set(null);
    this.usuarioActual.set(null);
    localStorage.removeItem(CLAVE_TOKEN);
  }

  private guardarSesion(respuesta: TokenRespuestaApi): void {
    this.tokenActual.set(respuesta.access_token);
    this.usuarioActual.set(respuesta.usuario);
    localStorage.setItem(CLAVE_TOKEN, respuesta.access_token);
  }
}
