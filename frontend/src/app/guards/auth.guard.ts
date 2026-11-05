import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).autenticado()) {
    return true;
  }
  return inject(Router).createUrlTree(['/ingresar'], { queryParams: { returnUrl: state.url } });
};

export const invitadoGuard: CanActivateFn = () => {
  return inject(AuthService).autenticado() ? inject(Router).createUrlTree(['/']) : true;
};
