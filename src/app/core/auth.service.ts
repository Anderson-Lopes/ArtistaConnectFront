import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Session } from '../models/music';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly currentSession = signal<Session | null>(null);
  private expirationTimer: ReturnType<typeof setTimeout> | null = null;

  readonly session = this.currentSession.asReadonly();

  isAuthenticated(): boolean {
    const session = this.currentSession();
    if (!session) {
      return false;
    }
    if (session.expiresAt <= Date.now()) {
      this.logout();
      return false;
    }
    return true;
  }

  login(userName: string, password: string): Observable<void> {
    return this.api.login(userName, password).pipe(
      map((response) => this.createSession(response, userName)),
      tap((session) => this.setSession(session)),
      map(() => undefined),
    );
  }

  register(userName: string, password: string): Observable<void> {
    return this.api.registerUser(userName, password).pipe(map(() => undefined));
  }

  logout(): void {
    this.clearSession();
  }

  endSessionAndNavigate(): void {
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  private createSession(response: string, userName: string): Session {
    let token = response.trim();
    try {
      const parsed: unknown = JSON.parse(token);
      if (typeof parsed === 'string') {
        token = parsed;
      }
    } catch {
      // The current API returns the JWT as plain text.
    }

    const payload = token.split('.')[1];
    if (!payload || token.split('.').length !== 3) {
      throw new Error('A resposta de autenticação não contém um JWT válido.');
    }

    try {
      const decoded = atob(
        payload
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(Math.ceil(payload.length / 4) * 4, '='),
      );
      const claims: unknown = JSON.parse(decoded);
      if (
        typeof claims !== 'object' ||
        claims === null ||
        !('exp' in claims) ||
        typeof claims.exp !== 'number'
      ) {
        throw new Error('Missing expiration');
      }
      const expiresAt = claims.exp * 1000;
      if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        throw new Error('Expired token');
      }
      return { token, userName, expiresAt };
    } catch {
      throw new Error('A API retornou um token sem uma expiração válida.');
    }
  }

  private setSession(session: Session): void {
    this.clearExpirationTimer();
    this.currentSession.set(session);
    this.expirationTimer = setTimeout(
      () => this.endSessionAndNavigate(),
      Math.max(0, session.expiresAt - Date.now()),
    );
  }

  private clearSession(): void {
    this.clearExpirationTimer();
    this.currentSession.set(null);
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimer !== null) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
  }
}
