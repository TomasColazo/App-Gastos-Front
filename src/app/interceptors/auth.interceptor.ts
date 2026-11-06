import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el servidor responde 401 o 403 en una llamada protegida, reintentamos autenticar y reenviar
      if ((error.status === 401 || error.status === 403) && !req.url.includes('/api/v1/auth/')) {
        authService.logout();
        return authService.login('tomeix13@gmail.com', 'admin123').pipe(
          switchMap((authRes) => {
            const retriedReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${authRes.token}`
              }
            });
            return next(retriedReq);
          }),
          catchError((loginError) => throwError(() => loginError))
        );
      }
      return throwError(() => error);
    })
  );
};
