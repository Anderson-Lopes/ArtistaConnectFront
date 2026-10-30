import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

function createToken(expiresInSeconds = 3600): string {
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds }),
  )
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${payload}.signature`;
}

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        AuthService,
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    auth.logout();
    http.verify();
  });

  it('creates an in-memory session from the JWT returned by the API', () => {
    let completed = false;
    auth.login('Ana', 'senha-segura-123').subscribe(() => {
      completed = true;
    });

    const request = http.expectOne('/api/login/auth');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nome: 'Ana',
      senha: 'senha-segura-123',
    });
    request.flush(createToken());

    expect(completed).toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.session()?.userName).toBe('Ana');
  });

  it('rejects a token without an expiration claim', () => {
    let failure = '';
    auth.login('Ana', 'senha-segura-123').subscribe({
      error: (error: unknown) => {
        failure = error instanceof Error ? error.message : '';
      },
    });
    http.expectOne('/api/login/auth').flush(`header.${btoa('{}')}.signature`);

    expect(failure).toContain('expiração válida');
    expect(auth.session()).toBeNull();
  });

  it('shows a connection error when the API proxy is unavailable', () => {
    let failure = '';
    auth.login('Ana', 'senha-segura-123').subscribe({
      error: (error: unknown) => {
        failure = error instanceof Error ? error.message : '';
      },
    });
    http.expectOne('/api/login/auth').flush('Bad Gateway', {
      status: 502,
      statusText: 'Bad Gateway',
    });

    expect(failure).toContain('Não foi possível conectar à API');
  });

  it('clears the session on logout', () => {
    auth.login('Ana', 'senha-segura-123').subscribe();
    http.expectOne('/api/login/auth').flush(createToken());
    expect(auth.isAuthenticated()).toBe(true);

    auth.logout();

    expect(auth.session()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('sends registration credentials to the user endpoint', () => {
    let completed = false;
    auth.register('Ana', 'senha-segura-123').subscribe(() => {
      completed = true;
    });
    const request = http.expectOne('/api/usuarios');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nome: 'Ana',
      senha: 'senha-segura-123',
    });
    request.flush({ id: 1, nome: 'Ana' });

    expect(completed).toBe(true);
    expect(auth.session()).toBeNull();
  });
});
