import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token();
  const esApi = req.url.startsWith(environment.apiUrl);
  const solicitud =
    token && esApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(solicitud).pipe(
    catchError((error: HttpErrorResponse) => {
      const esAuth = req.url.startsWith(`${environment.apiUrl}/auth/`);
      if (error.status === 401 && esApi && !esAuth) {
        auth.cerrarSesion();
        router.navigate(['/ingresar'], { queryParams: { returnUrl: router.url } });
      }
      return throwError(() => error);
    }),
  );
};
