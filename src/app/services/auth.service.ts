import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, catchError, map } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  defaultCurrency: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/auth';

  token = signal<string | null>(localStorage.getItem('auth_token'));
  currentUser = signal<User | null>(
    localStorage.getItem('auth_user') ? JSON.parse(localStorage.getItem('auth_user')!) : null
  );

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, { email, password }).pipe(
      tap(res => {
        this.setSession(res);
      })
    );
  }

  register(name: string, email: string, password: string, defaultCurrency = 'ARS'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
      name,
      email,
      password,
      defaultCurrency
    }).pipe(
      tap(res => {
        this.setSession(res);
      })
    );
  }

  /**
   * Auto-login inicial para facilitar el uso inmediato con la cuenta de Tomas
   */
  ensureAuthenticated(): Observable<boolean> {
    if (this.token()) {
      return of(true);
    }
    return this.login('tomeix13@gmail.com', 'admin123').pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.token.set(null);
    this.currentUser.set(null);
  }

  private setSession(auth: AuthResponse): void {
    localStorage.setItem('auth_token', auth.token);
    localStorage.setItem('auth_user', JSON.stringify(auth.user));
    this.token.set(auth.token);
    this.currentUser.set(auth.user);
  }
}
