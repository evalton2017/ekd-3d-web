import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { catchError, throwError } from 'rxjs';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(Keycloak);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Sessão expirada ou inválida (401). Redirecionando para o Keycloak...');
        keycloak.logout({
          redirectUri: window.location.origin + '/ekd-3d-web/'
        });
      }

      return throwError(() => error);
    })
  );
};
