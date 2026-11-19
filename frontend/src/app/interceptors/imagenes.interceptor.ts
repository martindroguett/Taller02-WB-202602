import { HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';

/** Las fotos de demo llegan como «/fotos-demo/x.jpg»: en la app Android hay que pedirlas al sitio público, no a https://localhost. */
const ruta = (valor: unknown): unknown =>
  typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//')
    ? environment.sitioUrl + valor
    : valor;

function completar(dato: unknown): unknown {
  if (Array.isArray(dato)) return dato.map(completar);
  if (dato && typeof dato === 'object') {
    return Object.fromEntries(
      Object.entries(dato).map(([clave, valor]) => [
        clave,
        clave === 'imagen_url' ? ruta(valor) : completar(valor),
      ]),
    );
  }
  return dato;
}

export const imagenesInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.sitioUrl === window.location.origin || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  return next(req).pipe(
    map((evento) =>
      evento.type === HttpEventType.Response && evento instanceof HttpResponse
        ? evento.clone({ body: completar(evento.body) })
        : evento,
    ),
  );
};
