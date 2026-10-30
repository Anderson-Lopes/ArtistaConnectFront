import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../app.routes';
import { ApiService } from './api.service';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

function createToken(): string {
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  )
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${payload}.signature`;
}

describe('authInterceptor', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let client: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        ApiService,
        AuthService,
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    client = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    auth.logout();
    http.verify();
  });

  function signIn(): void {
    auth.login('Ana', 'senha-segura-123').subscribe();
    http.expectOne('/api/login/auth').flush(createToken());
  }

  it('adds a Bearer token to API calls', () => {
    signIn();
    client.get('/api/musicas/').subscribe();

    const request = http.expectOne('/api/musicas/');
    expect(request.request.headers.get('Authorization')).toBe(
      `Bearer ${auth.session()?.token}`,
    );
    request.flush([]);
  });

  it('keeps the session when the API returns 403', () => {
    signIn();
    client.get('/api/musicas/').subscribe({ error: () => undefined });

    http.expectOne('/api/musicas/').flush(
      { message: 'Acesso negado.' },
      { status: 403, statusText: 'Forbidden' },
    );

    expect(auth.isAuthenticated()).toBe(true);
  });

  it('clears the session when the API returns 401', () => {
    signIn();
    client.get('/api/musicas/').subscribe({ error: () => undefined });

    http.expectOne('/api/musicas/').flush(
      { message: 'Sessão expirada.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(auth.session()).toBeNull();
  });
});
